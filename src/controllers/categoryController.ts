import type { Request, Response } from "express";
import prisma from "../prisma.ts";

// CREATE
const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(409).json({
        message: "The name is required",
      });
    }
    const existingCategetory = await prisma.category.findUnique({
      where: { name },
    });
    if (existingCategetory) {
      return res.status(40).json({
        message: "This category already exist",
      });
    }
    const newCategory = await prisma.category.create({
      data: { name },
    });
    res.status(200).json({
      message: "Category created",
      categoryID: newCategory.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating.",
      error: error,
    });
  }
};

// READ ALL
const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({
      message: "Error retrieving categories",
    });
  }
};
// READ BY ID
const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
      error: error,
    });
  }
};

// UPDATE
const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        message: "The new category name is required.",
      });
    }
    const isCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!isCategory) {
      return res.status(404).json({
        message: `Category with ID ${id} dose not exist.`,
      });
    }
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });

    res.status(200).json({
      message: "Category updated successfuly",
      updateCategoryId: updatedCategory.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
      error: error,
    });
  }
};

// DELETE

const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const isCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!isCategory) {
      return res.status(404).json({
        message: `Category with ID ${id} dose not exist.`,
      });
    }
    await prisma.category.delete({
      where: { id: Number(id) },
    });
    res.status(204).json({
      message:
        "Category and all its associated products have been successfully deleted!",
    });
  } catch (error) {
    res.status(500).json({
      message: "something went wrong",
      error: error,
    });
  }
};
const categoryController = {
  createCategory,
  getCategoryById,
  getCategories,
  updateCategory,
  deleteCategory,
};

export default categoryController;
