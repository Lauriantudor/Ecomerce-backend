import prisma from "../prisma.js";
//FUCTIONS FOR COSTOMER
// ADD NEW ADDRESS
const createAddrees = async (req, res) => {
    const { title, fullName, phoneNumber, city, county, country, streetAddress } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "unauthorized. Please login",
        });
    }
    try {
        if (!fullName ||
            !phoneNumber ||
            !city ||
            !county ||
            !country ||
            !streetAddress) {
            return res
                .status(400)
                .json({ message: "All address fields are required." });
        }
        const newAddress = await prisma.address.create({
            data: {
                title: title || "Home",
                fullName,
                phoneNumber,
                city,
                county,
                country,
                streetAddress,
                userId: Number(userId),
            },
        });
        return res.status(201).json({
            message: "Adress added successfuly",
            addressId: newAddress.id,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};
//GET OWN ADDRESS
const getUserAddresses = async (req, res) => {
    const userId = req.user?.id;
    try {
        const addresses = await prisma.address.findMany({
            where: {
                userId: Number(userId),
            },
        });
        return res.status(200).json({
            addresses,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};
// 3. ACTUALIZARE ADRESĂ PROPRIE
const updateAddress = async (req, res) => {
    const { id } = req.params; // ID-ul adresei din URL
    const { title, fullName, phoneNumber, city, county, country, streetAddress } = req.body;
    const userId = req.user?.id;
    try {
        const existingAddress = await prisma.address.findUnique({
            where: { id: Number(id) },
        });
        if (!existingAddress) {
            return res.status(404).json({ message: "Address not found." });
        }
        if (existingAddress.userId !== Number(userId)) {
            return res.status(403).json({
                message: "Forbidden. This is not your address.",
            });
        }
        const updatedAddress = await prisma.address.update({
            where: { id: Number(id) },
            data: {
                title: title ?? existingAddress.title,
                fullName: fullName ?? existingAddress.fullName,
                phoneNumber: phoneNumber ?? existingAddress.phoneNumber,
                city: city ?? existingAddress.city,
                county: county ?? existingAddress.county,
                country: country ?? existingAddress.country,
                streetAddress: streetAddress ?? existingAddress.streetAddress,
            },
        });
        return res.status(200).json({
            message: "Address updated successfully!",
            addressId: updatedAddress.id,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//FUNCTIONS FOR ADMIN
//GET ALL ADDRESSES
const adminGetAllAddresses = async (req, res) => {
    try {
        const addresses = await prisma.address.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });
        return res.status(200).json({
            addresses,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
//GET ADDRESSES BY USER
const adminGetAddressesByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const addresses = await prisma.address.findMany({
            where: {
                userId: Number(userId),
            },
        });
        return res.status(200).json({
            addresses,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
// FUNCTION FOR EVERYONE LOGIN (ADMIN & CUSTOMER)
//DELETE ADDRESS
const deleteAddress = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    try {
        const address = await prisma.address.findUnique({
            where: {
                id: Number(id),
            },
        });
        if (!address) {
            return res.status(404).json({
                message: `Address with Id ${id} not found`,
            });
        }
        //Check the role
        if (userRole !== "admin" && address.userId !== Number(userId)) {
            return res.status(403).json({
                message: "Forbidden. You can only delete your own addresses",
            });
        }
        await prisma.address.delete({
            where: { id: Number(id) },
        });
        return res.status(200).json({
            message: userRole === "admin"
                ? "Address deleted successfully by admin."
                : "Your address has been deleted successfully.",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
const addressController = {
    createAddrees,
    getUserAddresses,
    updateAddress,
    adminGetAddressesByUserId,
    adminGetAllAddresses,
    deleteAddress,
};
export default addressController;
