import type { Request, Response } from "express";
import prisma from "../prisma.ts";

const createMessage = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      message: "The fields( name, email, message) are requires",
    });
  }
  try {
    const newContactMessage = await prisma.contactMessage.create({
      data: {
        name: name,
        email: email,
        subject: subject || null,
        message: message,
      },
    });
    return res.status(200).json({
      message: "Contact message created",
      contactMessageId: newContactMessage.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error,
    });
  }
};
// READ BY ID
const getContactMessageById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const contactMessage = await prisma.contactMessage.findUnique({
      where: { id: Number(id) },
    });

    if (!contactMessage) {
      return res.status(404).json({
        message: `Contact message with ID ${id} does not exist.`,
      });
    }
    return res.status(200).json(contactMessage);
  } catch (error: any) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// READ ALL
const getContactMessages = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 0;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    const [contactMessage, totalContactMessages] = await prisma.$transaction([
      prisma.contactMessage.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.contactMessage.count({
        where: whereClause,
      }),
    ]);
    const totalPages = limit > 0 ? Math.ceil(totalContactMessages / limit) : 1;

    return res.status(200).json({
      contactMessage,
      meta: {
        totalContactMessages,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
};

// MARK AS READ
const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const contactMessage = await prisma.contactMessage.findUnique({
      where: { id: Number(id) },
    });
    if (!contactMessage) {
      return res.status(404).json({
        message: `Contact message with ID ${id} does not exist`,
      });
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: "Message marked as read successfully",
      contactMessageID: updatedMessage.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error,
    });
  }
};

const contactMessageController = {
  createMessage,
  getContactMessageById,
  getContactMessages,
  markAsRead,
};

export default contactMessageController;
