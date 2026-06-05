import { Response, NextFunction } from "express";
import { AddressModel } from "../models/Address";
import { NotificationModel } from "../models/Notification";
import { AuthenticatedRequest } from "../middlewares/auth";
import { AppError } from "../utils/AppError";

export class UserController {
  /**
   * Add a new saved address for the logged-in customer.
   */
  public static async addAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return next(new AppError("Unauthorized", 401));

      const { houseNo, street, landmark, city, state, pincode, latitude, longitude, isDefault } = req.body;

      if (!houseNo || !street || !city || !state || !pincode || latitude === undefined || longitude === undefined) {
        return next(new AppError("Please provide all required address fields, including coordinates.", 400));
      }

      // Check if user has any existing addresses
      const count = await AddressModel.countDocuments({ userId });
      const markDefault = count === 0 ? true : !!isDefault;

      // If this address is set to default, remove default flags on others
      if (markDefault) {
        await AddressModel.updateMany({ userId }, { isDefault: false });
      }

      const address = await AddressModel.create({
        userId,
        houseNo,
        street,
        landmark,
        city,
        state,
        pincode,
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        isDefault: markDefault,
      });

      res.status(201).json({
        success: true,
        message: "Address added successfully.",
        address: {
          id: address._id.toString(),
          userId: address.userId.toString(),
          houseNo: address.houseNo,
          street: address.street,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: address.location.coordinates[1],
          longitude: address.location.coordinates[0],
          isDefault: address.isDefault,
          createdAt: address.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves list of saved addresses for the customer.
   */
  public static async getAddresses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return next(new AppError("Unauthorized", 401));

      const addresses = await AddressModel.find({ userId }).sort({ isDefault: -1 });

      const formattedAddresses = addresses.map((addr) => ({
        id: addr._id.toString(),
        userId: addr.userId.toString(),
        houseNo: addr.houseNo,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.location.coordinates[1],
        longitude: addr.location.coordinates[0],
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      }));

      res.status(200).json({
        success: true,
        addresses: formattedAddresses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a saved address.
   */
  public static async deleteAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { addressId } = req.params;

      const address = await AddressModel.findById(addressId);

      if (!address || address.userId.toString() !== userId) {
        return next(new AppError("Address not found or unauthorized.", 404));
      }

      await AddressModel.findByIdAndDelete(addressId);

      res.status(200).json({
        success: true,
        message: "Address deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch all notifications for the authenticated user.
   */
  public static async getNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return next(new AppError("Unauthorized", 401));

      const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });

      const formattedNotifications = notifications.map((n) => ({
        id: n._id.toString(),
        userId: n.userId.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        readStatus: n.readStatus,
        createdAt: n.createdAt,
      }));

      res.status(200).json({
        success: true,
        notifications: formattedNotifications,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read.
   */
  public static async markNotificationRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      const notification = await NotificationModel.findById(notificationId);

      if (!notification || notification.userId.toString() !== userId) {
        return next(new AppError("Notification not found.", 404));
      }

      await NotificationModel.findByIdAndUpdate(notificationId, { readStatus: true });

      res.status(200).json({
        success: true,
        message: "Notification marked as read.",
      });
    } catch (error) {
      next(error);
    }
  }
}
