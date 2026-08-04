"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const User_1 = require("../models/User");
const Address_1 = require("../models/Address");
const Notification_1 = require("../models/Notification");
const AppError_1 = require("../utils/AppError");
class UserController {
    /**
     * Add a new saved address for the logged-in customer.
     */
    static async addAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const { houseNo, street, landmark, city, state, pincode, latitude, longitude, isDefault } = req.body;
            if (!houseNo || !street || !city || !state || !pincode || latitude === undefined || longitude === undefined) {
                return next(new AppError_1.AppError("Please provide all required address fields, including coordinates.", 400));
            }
            // Check if user has any existing addresses
            const count = await Address_1.AddressModel.countDocuments({ userId });
            const markDefault = count === 0 ? true : !!isDefault;
            // If this address is set to default, remove default flags on others
            if (markDefault) {
                await Address_1.AddressModel.updateMany({ userId }, { isDefault: false });
            }
            const address = await Address_1.AddressModel.create({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves list of saved addresses for the customer.
     */
    static async getAddresses(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const addresses = await Address_1.AddressModel.find({ userId }).sort({ isDefault: -1 });
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a saved address.
     */
    static async deleteAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            const { addressId } = req.params;
            const address = await Address_1.AddressModel.findById(addressId);
            if (!address || address.userId.toString() !== userId) {
                return next(new AppError_1.AppError("Address not found or unauthorized.", 404));
            }
            await Address_1.AddressModel.findByIdAndDelete(addressId);
            res.status(200).json({
                success: true,
                message: "Address deleted successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Fetch all notifications for the authenticated user.
     */
    static async getNotifications(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const notifications = await Notification_1.NotificationModel.find({ userId }).sort({ createdAt: -1 });
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mark notification as read.
     */
    static async markNotificationRead(req, res, next) {
        try {
            const userId = req.user?.id;
            const { notificationId } = req.params;
            const notification = await Notification_1.NotificationModel.findById(notificationId);
            if (!notification || notification.userId.toString() !== userId) {
                return next(new AppError_1.AppError("Notification not found.", 404));
            }
            await Notification_1.NotificationModel.findByIdAndUpdate(notificationId, { readStatus: true });
            res.status(200).json({
                success: true,
                message: "Notification marked as read.",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get the current authenticated user's profile.
     * GET /api/v1/users/profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const user = await User_1.UserModel.findById(userId).select("-passwordHash");
            if (!user)
                return next(new AppError_1.AppError("User not found.", 404));
            res.status(200).json({
                success: true,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update the current user's profile (name, email).
     * PATCH /api/v1/users/profile
     */
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const { name, email } = req.body;
            // Build update payload (only allowed fields)
            const updateData = {};
            if (name && name.trim())
                updateData.name = name.trim();
            if (email && email.trim())
                updateData.email = email.toLowerCase().trim();
            if (Object.keys(updateData).length === 0) {
                return next(new AppError_1.AppError("Please provide at least one field to update.", 400));
            }
            // Check email uniqueness if changing email
            if (updateData.email) {
                const existing = await User_1.UserModel.findOne({
                    email: updateData.email,
                    _id: { $ne: userId },
                });
                if (existing) {
                    return next(new AppError_1.AppError("This email is already taken by another account.", 400));
                }
            }
            const user = await User_1.UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash");
            if (!user)
                return next(new AppError_1.AppError("User not found.", 404));
            res.status(200).json({
                success: true,
                message: "Profile updated successfully.",
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
