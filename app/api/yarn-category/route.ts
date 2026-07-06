import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import YarnCategory from "@/models/YarnCategory";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { findUserByEmail } from "@/lib/db";

// GET - List all yarn categories
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const categories = await YarnCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    // Get unique creator emails
    const creatorEmails = [...new Set(categories.map((cat) => cat.createdBy))];
    
    // Fetch all users and create a map
    const userMap = new Map<string, string>();
    for (const email of creatorEmails) {
      const userData = await findUserByEmail(email);
      if (userData) {
        userMap.set(email, userData.name || email);
      } else {
        userMap.set(email, email); // Fallback to email if user not found
      }
    }

    return NextResponse.json(
      {
        data: categories.map((cat) => ({
          id: cat._id.toString(),
          name: cat.name,
          description: cat.description,
          noOfCones: cat.noOfCones,
          weightPerBox: cat.weightPerBox,
          createdBy: cat.createdBy,
          createdByName: userMap.get(cat.createdBy) || cat.createdBy,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching yarn categories:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch yarn categories" },
      { status: 500 }
    );
  }
}

// POST - Create new yarn category
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, noOfCones, weightPerBox } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Default noOfCones to 6 if not provided
    const conesCount = noOfCones !== undefined ? noOfCones : 6;

    if (
      noOfCones !== undefined &&
      (typeof conesCount !== "number" || conesCount < 0)
    ) {
      return NextResponse.json(
        { message: "noOfCones must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate and format weightPerBox if provided
    let formattedWeightPerBox = weightPerBox;
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
        formattedWeightPerBox = parseFloat(weightPerBox.toFixed(2));
      } else if (decimalPart.length < 2 || decimalPart.length > 3) {
        return NextResponse.json(
          { message: "weightPerBox must be a whole number or have 2-3 decimal places" },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const category = new YarnCategory({
      name: name.trim(),
      description: description?.trim() || undefined,
      noOfCones: conesCount,
      weightPerBox: formattedWeightPerBox !== undefined ? formattedWeightPerBox : 36,
      createdBy: user.email,
    });

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
        message: "Yarn category created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating yarn category:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Failed to create yarn category" },
      { status: 500 }
    );
  }
}

