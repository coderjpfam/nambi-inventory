import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import YarnCategory from "@/models/YarnCategory";
import YarnInEntry from "@/models/YarnInEntry";
import YarnExEntry from "@/models/YarnExEntry";
import { getAuthenticatedUser } from "@/lib/api-auth";
import mongoose from "mongoose";

// GET - Get single yarn category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const category = await YarnCategory.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { message: "Yarn category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          noOfCones: category.noOfCones,
          weightPerBox: category.weightPerBox,
          createdBy: category.createdBy,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching yarn category:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch yarn category" },
      { status: 500 }
    );
  }
}

// PUT - Update yarn category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid ObjectId format:", id);
      return NextResponse.json(
        { message: `Invalid category ID format: ${id}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, noOfCones, weightPerBox } = body;

    await connectDB();
    const category = await YarnCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Yarn category not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name !== undefined) {
      category.name = name.trim();
    }
    if (description !== undefined) {
      category.description = description?.trim() || undefined;
    }
    if (noOfCones !== undefined) {
      if (noOfCones === null || noOfCones === "") {
        category.noOfCones = undefined;
      } else if (typeof noOfCones !== "number" || noOfCones < 0) {
        return NextResponse.json(
          { message: "noOfCones must be a non-negative number" },
          { status: 400 }
        );
      } else {
        category.noOfCones = noOfCones;
      }
    }
    if (weightPerBox !== undefined) {
      if (typeof weightPerBox !== "number" || weightPerBox < 0) {
        return NextResponse.json(
          { message: "weightPerBox must be a non-negative number" },
          { status: 400 }
        );
      }
      
      // Check decimal places: allow whole numbers (0 decimal places) or 2-3 decimal places
      const weightStr = weightPerBox.toString();
      const decimalPart = weightStr.includes(".") ? weightStr.split(".")[1] : "";
      
      // If whole number, format to have .00
      if (decimalPart.length === 0) {
        category.weightPerBox = parseFloat(weightPerBox.toFixed(2));
      } else if (decimalPart.length < 2 || decimalPart.length > 3) {
        return NextResponse.json(
          { message: "weightPerBox must be a whole number or have 2-3 decimal places" },
          { status: 400 }
        );
      } else {
        category.weightPerBox = weightPerBox;
      }
    }

    await category.save();

    return NextResponse.json(
      {
        data: {
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          noOfCones: category.noOfCones,
          weightPerBox: category.weightPerBox,
          createdBy: category.createdBy,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
        message: "Yarn category updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating yarn category:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Failed to update yarn category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete yarn category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const categoryObjectId = new mongoose.Types.ObjectId(id);

    const category = await YarnCategory.findById(categoryObjectId);

    if (!category) {
      return NextResponse.json(
        { message: "Yarn category not found" },
        { status: 404 }
      );
    }

    const [inDeleteResult, exDeleteResult] = await Promise.all([
      YarnInEntry.deleteMany({ categoryId: categoryObjectId }),
      YarnExEntry.deleteMany({ categoryId: categoryObjectId }),
    ]);

    await YarnCategory.findByIdAndDelete(categoryObjectId);

    return NextResponse.json(
      {
        message: "Yarn category deleted successfully",
        deletedInEntries: inDeleteResult.deletedCount,
        deletedExEntries: exDeleteResult.deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting yarn category:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete yarn category" },
      { status: 500 }
    );
  }
}

