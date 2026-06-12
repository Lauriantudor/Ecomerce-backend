import prisma from "../prisma.js";
import path from "path";
import fs from "fs";
//CREATE
const createProduct = async (req, res) => {
    const { name, description, price, stock, altImage, categoryId } = req.body;
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }
    if ((imageUrl && !altImage) || altImage.trim() === "") {
        return res.status(400).json({
            message: "You need to give to image an description.",
        });
    }
    if (!name || !price || !stock || !categoryId) {
        return res.status(400).json({
            mesaage: "The fields (name, price, stock, catregoryId) are required",
        });
    }
    try {
        const existingCategory = await prisma.category.findUnique({
            where: { id: Number(categoryId) },
        });
        if (!existingCategory) {
            return res.status(404).json({
                message: "Category not found",
            });
        }
        // 4. Crearea produsului
        const newProduct = await prisma.product.create({
            data: {
                name: name,
                description: description || null,
                price: parseFloat(price),
                stock: stock ? Number(stock) : 0,
                imageUrl: imageUrl || null,
                altImage: imageUrl ? altImage : null,
                categoryId: Number(categoryId),
            },
        });
        return res.status(200).json({
            message: "Product added",
            productId: newProduct.id,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Sothing went wrong",
            error: error,
        });
    }
};
// READ BY ID
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: { category: true },
        });
        if (!product) {
            return res.status(404).json({
                message: `Product with ID ${id} does not exist.`,
            });
        }
        return res.status(200).json(product);
    }
    catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
};
// READ ALL
const getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 0;
        const catregoryId = req.query.categoryId
            ? Number(req.query.categoryId)
            : undefined;
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (catregoryId) {
            whereClause.catregoryId = catregoryId;
        }
        const [products, totalProducts] = await prisma.$transaction([
            prisma.product.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                include: {
                    category: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.product.count({
                where: whereClause,
            }),
        ]);
        const totalPages = Math.ceil(totalProducts / limit);
        return res.status(200).json({
            products,
            meta: {
                totalProducts,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// UPDATE PRODUCT
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, altImage, categoryId } = req.body;
    try {
        // 1. Verificăm dacă produsul există
        const isProduct = await prisma.product.findUnique({
            where: { id: Number(id) },
        });
        if (!isProduct) {
            // Dacă utilizatorul a încărcat totuși o poză, dar produsul nu există, o ștergem pe cea nouă din uploads ca să nu ocupe spațiu degeaba
            if (req.file) {
                const uploadedPath = path.join(process.cwd(), "uploads", req.file.filename);
                if (fs.existsSync(uploadedPath))
                    fs.unlinkSync(uploadedPath);
            }
            return res.status(404).json({
                message: `Product with ID ${id} does not exist.`,
            });
        }
        let newImageUrl = isProduct.imageUrl;
        let finalAltImage = isProduct.altImage;
        // 2. Validare: Dacă încarcă o imagine nouă, obligăm să pună și o descriere nouă (altImage)
        if (req.file && (!altImage || altImage.trim() === "")) {
            // Ștergem poza nouă care tocmai s-a salvat în folderul uploads, pentru că validarea a picat!
            const uploadedPath = path.join(process.cwd(), "uploads", req.file.filename);
            if (fs.existsSync(uploadedPath)) {
                fs.unlinkSync(uploadedPath);
            }
            return res.status(400).json({
                message: "You need to give to the new image a new description.",
            });
        }
        // 3. LOGICA PENTRU IMAGINE
        if (req.file) {
            // Setăm noua cale a imaginii (cu / în față pentru consistență la servirea statică)
            newImageUrl = `/uploads/${req.file.filename}`;
            finalAltImage = altImage; // Actualizăm descrierea imaginii noi
            // Ștergem vechea imagine de pe disc DOAR dacă exista una
            if (isProduct.imageUrl) {
                // Eliminăm slash-ul de la începutul căii salvate în DB pentru path.join
                const relativePath = isProduct.imageUrl.startsWith("/")
                    ? isProduct.imageUrl.substring(1)
                    : isProduct.imageUrl;
                const oldAbsolutePath = path.join(process.cwd(), relativePath);
                if (fs.existsSync(oldAbsolutePath)) {
                    fs.unlinkSync(oldAbsolutePath);
                }
            }
        }
        else {
            // Dacă NU s-a încărcat o imagine nouă, dar utilizatorul vrea doar să modifice textul alternativ existent
            if (altImage !== undefined) {
                finalAltImage = altImage;
            }
        }
        // 4. Verificăm dacă noua categorie specificată există
        if (categoryId && categoryId !== "undefined") {
            const existingCategory = await prisma.category.findUnique({
                where: { id: Number(categoryId) },
            });
            if (!existingCategory) {
                // În caz de eroare, ștergem poza nouă dacă s-a încărcat
                if (req.file) {
                    const uploadedPath = path.join(process.cwd(), "uploads", req.file.filename);
                    if (fs.existsSync(uploadedPath))
                        fs.unlinkSync(uploadedPath);
                }
                return res.status(404).json({
                    message: "The specified new category does not exist.",
                });
            }
        }
        // 5. Pregătirea datelor pentru Prisma (rezolvă problemele de conversie tip text din form-data)
        const updateData = {
            name: name !== undefined ? name : isProduct.name,
            description: description !== undefined ? description : isProduct.description,
            imageUrl: newImageUrl,
            altImage: finalAltImage,
        };
        if (price !== undefined && price !== "")
            updateData.price = parseFloat(price);
        if (stock !== undefined && stock !== "")
            updateData.stock = Number(stock);
        if (categoryId !== undefined &&
            categoryId !== "" &&
            categoryId !== "undefined") {
            updateData.categoryId = Number(categoryId);
        }
        // 6. Salvarea în Baza de Date prin Prisma
        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: updateData,
        });
        return res.status(200).json({
            message: "Product updated successfully!",
            product: updatedProduct,
        });
    }
    catch (error) {
        // În caz de eroare critică de sistem, curățăm fișierul nou urcat să nu rămână blocat pe disc
        if (req.file) {
            const uploadedPath = path.join(process.cwd(), "uploads", req.file.filename);
            if (fs.existsSync(uploadedPath))
                fs.unlinkSync(uploadedPath);
        }
        return res.status(500).json({
            message: "Something went wrong during the update.",
            error: error.message,
        });
    }
};
// DELETE
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const isProduct = await prisma.product.findUnique({
            where: { id: Number(id) },
        });
        if (!isProduct) {
            return res.status(404).json({
                message: `Product with ID ${id} does not exist.`,
            });
        }
        if (isProduct.imageUrl) {
            const absolutePath = path.join(process.cwd(), isProduct.imageUrl);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }
        await prisma.product.delete({
            where: { id: Number(id) },
        });
        return res.status(200).json({
            message: "The Product has been successfully deleted!",
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
};
// ADAUGARE STOC (APROVIZIONARE)
const addProductStock = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body; // Numărul de bucăți noi intrate în depozit
    if (quantity === undefined ||
        Number(quantity) <= 0 ||
        isNaN(Number(quantity))) {
        return res.status(400).json({
            message: "Please provide a valid quantity greater than 0.",
        });
    }
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
        });
        if (!product) {
            return res.status(404).json({
                message: `Product with ID ${id} does not exist.`,
            });
        }
        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                stock: product.stock + Number(quantity),
            },
        });
        return res.status(200).json({
            message: "Stock updated successfully!",
            productName: updatedProduct.name,
            oldStock: product.stock,
            newStock: updatedProduct.stock,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Something went wrong while updating stock.",
            error: error.message,
        });
    }
};
const productController = {
    createProduct,
    getProductById,
    getProducts,
    updateProduct,
    deleteProduct,
    addProductStock,
};
export default productController;
