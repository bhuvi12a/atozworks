import { Response, NextFunction } from "express";
import { BookingModel } from "../models/Booking";
import { ServiceModel } from "../models/Service";
import { AddressModel } from "../models/Address";
import { ProviderModel } from "../models/Provider";
import { AuthenticatedRequest } from "../middlewares/auth";
import { BookingEngine } from "../services/bookingEngine";
import { SocketService } from "../services/socketService";
import { NotificationService } from "../services/notification";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const formatBookingResponse = (b: any) => {
  const addr = b.addressId;
  const cust = b.customerId;
  const prov = b.providerId;
  const serv = b.serviceId;

  const addressText = addr
    ? `${addr.houseNo}, ${addr.street}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}`
    : "";

  return {
    id: b._id.toString(),
    bookingNumber: b.bookingNumber,
    customerId: cust?._id?.toString() || b.customerId?.toString(),
    providerId: prov?._id?.toString() || b.providerId?.toString(),
    serviceId: serv?._id?.toString() || b.serviceId?.toString(),
    addressId: addr?._id?.toString() || b.addressId?.toString(),
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime,
    status: b.status,
    estimatedPrice: b.estimatedPrice,
    finalPrice: b.finalPrice,
    paymentStatus: b.paymentStatus,
    createdAt: b.createdAt,
    
    // Flat keys for admin compat
    customer: cust?.name || "Unknown",
    phone: cust?.phone || "",
    email: cust?.email || "",
    service: serv?.title || "Unknown",
    provider: prov?.userId?.name || "Unassigned",
    date: b.bookingDate,
    price: `₹${b.finalPrice || b.estimatedPrice}`,
    lat: addr?.location?.coordinates[1] || 0,
    lng: addr?.location?.coordinates[0] || 0,
    address: addressText,

    // Nested objects for client compat
    customerObj: cust ? {
      id: cust._id.toString(),
      name: cust.name,
      email: cust.email,
      phone: cust.phone
    } : null,
    providerObj: prov ? {
      id: prov._id.toString(),
      experience: prov.experience,
      rating: prov.rating,
      user: prov.userId ? {
        id: prov.userId._id?.toString() || prov.userId.toString(),
        name: prov.userId.name,
        email: prov.userId.email,
        phone: prov.userId.phone
      } : null
    } : null,
    serviceObj: serv ? {
      id: serv._id.toString(),
      title: serv.title,
      description: serv.description,
      duration: serv.duration,
      basePrice: serv.basePrice
    } : null,
    addressObj: addr ? {
      id: addr._id.toString(),
      houseNo: addr.houseNo,
      street: addr.street,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      latitude: addr.location?.coordinates[1] || 0,
      longitude: addr.location?.coordinates[0] || 0,
      isDefault: addr.isDefault
    } : null
  };
};

export class BookingController {
  /**
   * Submit a new home service booking and trigger matchmaking loop.
   */
  public static async createBooking(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.user?.id;
      if (!customerId) return next(new AppError("Unauthorized", 401));

      const { serviceId, addressId, bookingDate, bookingTime, couponCode, materialCharges } = req.body;

      if (!serviceId || !addressId || !bookingDate || !bookingTime) {
        return next(new AppError("Missing required booking specifications.", 400));
      }

      // 1. Verify service validity
      const service = await ServiceModel.findOne({ _id: serviceId, active: true });
      if (!service) return next(new AppError("Service is not available or inactive.", 404));

      // 2. Fetch address coordinates
      const address = await AddressModel.findOne({ _id: addressId, userId: customerId });
      if (!address) return next(new AppError("Invalid or unauthorized address choice.", 404));

      // 3. Compute billing invoice
      const materials = parseFloat(materialCharges || "0");
      const pricing = await BookingEngine.calculatePrice(
        serviceId,
        bookingDate,
        bookingTime,
        materials,
        couponCode
      );

      // 4. Generate unique Booking Number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanDate = bookingDate.replace(/-/g, "");
      const bookingNumber = `AW-${cleanDate}-${randomSuffix}`;

      // 5. Create Booking in database
      const booking = await BookingModel.create({
        bookingNumber,
        customerId,
        serviceId,
        addressId,
        bookingDate,
        bookingTime,
        status: "PENDING",
        estimatedPrice: pricing.finalPrice,
        paymentStatus: "PENDING",
      });

      logger.info(`Booking created: ${booking.bookingNumber} for Customer: ${customerId}`);

      // 6. Trigger Asynchronous Matchmaking Dispatch Loop
      BookingEngine.dispatchBookingRequest(
        booking._id.toString(),
        service.categoryId.toString(),
        address.location.coordinates[1], // latitude
        address.location.coordinates[0], // longitude
        bookingDate,
        bookingTime
      ).catch((err) => logger.error("Matchmaker failure after booking create:", err));

      res.status(201).json({
        success: true,
        message: "Booking request submitted. Finding nearest technician...",
        booking: {
          id: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          customerId: booking.customerId.toString(),
          serviceId: booking.serviceId.toString(),
          addressId: booking.addressId.toString(),
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          status: booking.status,
          estimatedPrice: booking.estimatedPrice,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
        },
        pricing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates state transition flow (e.g. ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED)
   */
  public static async updateBookingStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;
      const { status } = req.body; // e.g. "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"

      const validStatuses = [
        "PENDING",
        "SEARCHING_PROVIDER",
        "PROVIDER_ASSIGNED",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ];
      if (!validStatuses.includes(status)) {
        return next(new AppError("Invalid status parameter.", 400));
      }

      const booking = await BookingModel.findById(bookingId)
        .populate("customerId")
        .populate({
          path: "providerId",
          populate: { path: "userId" }
        });

      if (!booking) return next(new AppError("Booking record not found.", 404));

      const bookingCustomerIdStr = (booking.customerId as any)._id 
        ? (booking.customerId as any)._id.toString() 
        : booking.customerId.toString();

      const providerUserIdStr = (booking.providerId as any)?.userId?._id 
        ? (booking.providerId as any).userId._id.toString() 
        : ((booking.providerId as any)?.userId?.toString() || "");

      // Security Checks: Authorize status modifications
      const isCustomer = bookingCustomerIdStr === userId;
      const isProvider = providerUserIdStr === userId;
      const isAdmin = req.user?.role === "ADMIN";

      if (!isCustomer && !isProvider && !isAdmin) {
        return next(new AppError("You are not authorized to update this booking.", 403));
      }

      // Customer can only transition to CANCELLED (if state is pending or provider assigned)
      if (isCustomer && status !== "CANCELLED") {
        return next(new AppError("Customers can only cancel bookings.", 403));
      }

      if (isCustomer && booking.status !== "PENDING" && booking.status !== "PROVIDER_ASSIGNED") {
        return next(new AppError("This job cannot be cancelled anymore as the provider is already on the way.", 400));
      }

      // Update booking status
      const updateData: any = { status };

      if (status === "COMPLETED") {
        updateData.finalPrice = booking.estimatedPrice;
        
        // Mark payment status completed if it was COD / cash
        if (booking.paymentStatus === "PENDING") {
          updateData.paymentStatus = "COMPLETED";
        }
      }

      const updated = await BookingModel.findByIdAndUpdate(
        bookingId,
        updateData,
        { new: true }
      ).populate("customerId")
       .populate({ path: "providerId", populate: { path: "userId" } })
       .populate("serviceId")
       .populate("addressId");

      if (!updated) return next(new AppError("Failed to update booking status.", 500));

      // Emit Live Sockets Alert to Customer and Provider
      SocketService.emitToBooking(bookingId, "status_updated", {
        bookingId,
        status: updated.status,
      });

      // User Alert Notifications
      const recipientId = isProvider ? bookingCustomerIdStr : (providerUserIdStr || bookingCustomerIdStr);
      const title = `Booking Update: ${updated.status.replace(/_/g, " ")}`;
      const message = `Your service booking ${booking.bookingNumber} is now: ${updated.status.replace(/_/g, " ")}.`;

      await NotificationService.sendPush(recipientId, title, message, "BOOKING_UPDATE");

      res.status(200).json({
        success: true,
        message: `Booking status updated to ${updated.status} successfully.`,
        booking: formatBookingResponse(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves booking history for customers or active lists for providers.
   */
  public static async getBookings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let bookings;

      if (role === "ADMIN") {
        bookings = await BookingModel.find()
          .populate("customerId")
          .populate({ path: "providerId", populate: { path: "userId" } })
          .populate("serviceId")
          .populate("addressId")
          .sort({ createdAt: -1 });
      } else if (role === "PROVIDER") {
        const provider = await ProviderModel.findOne({ userId });

        if (!provider) return next(new AppError("Provider profile not found.", 404));

        bookings = await BookingModel.find({ providerId: provider._id })
          .populate("customerId")
          .populate("serviceId")
          .populate("addressId")
          .sort({ createdAt: -1 });
      } else {
        // Customer
        bookings = await BookingModel.find({ customerId: userId })
          .populate({ path: "providerId", populate: { path: "userId" } })
          .populate("serviceId")
          .populate("addressId")
          .sort({ createdAt: -1 });
      }

      const formattedBookings = bookings.map((b) => formatBookingResponse(b));

      res.status(200).json({
        success: true,
        bookings: formattedBookings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns details for a single booking.
   */
  public static async getBookingDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;

      const booking = await BookingModel.findById(bookingId)
        .populate("customerId")
        .populate({ path: "providerId", populate: { path: "userId" } })
        .populate("serviceId")
        .populate("addressId");

      if (!booking) return next(new AppError("Booking not found.", 404));

      const bookingCustomerIdStr = (booking.customerId as any)._id 
        ? (booking.customerId as any)._id.toString() 
        : booking.customerId.toString();

      const providerUserIdStr = (booking.providerId as any)?.userId?._id 
        ? (booking.providerId as any).userId._id.toString() 
        : ((booking.providerId as any)?.userId?.toString() || "");

      if (bookingCustomerIdStr !== userId && providerUserIdStr !== userId && req.user?.role !== "ADMIN") {
        return next(new AppError("You are not authorized to view this booking.", 403));
      }

      res.status(200).json({
        success: true,
        booking: formatBookingResponse(booking),
      });
    } catch (error) {
      next(error);
    }
  }
}
