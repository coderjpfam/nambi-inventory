import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import YarnInEntry from "@/models/YarnInEntry";
import YarnCategory from "@/models/YarnCategory"; // Import for populate
import Party from "@/models/Party"; // Import for populate
import { getAuthenticatedUser } from "@/lib/api-auth";
import { findUserByEmail } from "@/lib/db";
import mongoose from "mongoose";

// GET - List all yarn in entries
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
    
    // Ensure models are registered for populate (access to trigger registration)
    void YarnCategory;
    void Party;
    
    const entries = await YarnInEntry.find()
      .populate("categoryId", "name")
      .populate("partyId", "name")
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

    // Get unique creator emails
    const creatorEmails = [...new Set(entries.map((entry) => entry.createdBy))];
    
    // Fetch all users and create a map
    const userMap = new Map<string, string>();
    for (const email of creatorEmails) {
      const userData = await findUserByEmail(email);
      if (userData) {
        userMap.set(email, userData.name || email);
      } else {
        userMap.set(email, email);
      }
    }

    return NextResponse.json(
      {
        data: entries.map((entry) => ({
          id: entry._id.toString(),
          entryDate: entry.entryDate,
          name: entry.name,
          categoryId: entry.categoryId._id.toString(),
          categoryName: (entry.categoryId as any).name,
          lotNo: entry.lotNo,
          purchaseDate: entry.purchaseDate,
          partyId: entry.partyId._id.toString(),
          partyName: (entry.partyId as any).name,
          noOfBoxes: entry.noOfBoxes,
          weightInKg: entry.weightInKg,
          createdBy: entry.createdBy,
          createdByName: userMap.get(entry.createdBy) || entry.createdBy,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching yarn in entries:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch yarn in entries" },
      { status: 500 }
    );
  }
}

// POST - Create new yarn in entry
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
    const {
      entryDate,
      categoryId,
      lotNo,
      purchaseDate,
      partyId,
      noOfBoxes,
      weightInKg,
    } = body;

    // Validation
    if (!entryDate) {
      return NextResponse.json(
        { message: "Entry date is required" },
        { status: 400 }
      );
    }

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { message: "Valid category ID is required" },
        { status: 400 }
      );
    }

    if (!lotNo || !lotNo.trim()) {
      return NextResponse.json(
        { message: "Lot number is required" },
        { status: 400 }
      );
    }

    if (!partyId || !mongoose.Types.ObjectId.isValid(partyId)) {
      return NextResponse.json(
        { message: "Valid party ID is required" },
        { status: 400 }
      );
    }

    if (noOfBoxes === undefined || noOfBoxes === null || noOfBoxes < 0) {
      return NextResponse.json(
        { message: "Number of boxes must be a non-negative number" },
        { status: 400 }
      );
    }

    if (weightInKg === undefined || weightInKg === null || weightInKg < 0) {
      return NextResponse.json(
        { message: "Weight in kg must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate weightInKg decimal places (max 3)
    const weightStr = weightInKg.toString();
    const decimalPart = weightStr.includes(".") ? weightStr.split(".")[1] : "";
    if (decimalPart.length > 3) {
      return NextResponse.json(
        { message: "Weight in kg must have at most 3 decimal places" },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Ensure models are registered for populate (access to trigger registration)
    void YarnCategory;
    void Party;
    
    const entry = new YarnInEntry({
      entryDate: new Date(entryDate),
      categoryId: new mongoose.Types.ObjectId(categoryId),
      lotNo: lotNo.trim(),
      purchaseDate: new Date(purchaseDate || entryDate),
      partyId: new mongoose.Types.ObjectId(partyId),
      noOfBoxes: Number(noOfBoxes),
      weightInKg: Number(weightInKg),
      createdBy: user.email,
    });

    await entry.save();

    // Populate for response
    await entry.populate("categoryId", "name");
    await entry.populate("partyId", "name");

    return NextResponse.json(
      {
        data: {
          id: entry._id.toString(),
          entryDate: entry.entryDate,
          name: entry.name,
          categoryId: entry.categoryId._id.toString(),
          categoryName: (entry.categoryId as any).name,
          lotNo: entry.lotNo,
          purchaseDate: entry.purchaseDate,
          partyId: entry.partyId._id.toString(),
          partyName: (entry.partyId as any).name,
          noOfBoxes: entry.noOfBoxes,
          weightInKg: entry.weightInKg,
          createdBy: entry.createdBy,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
        message: "Yarn in entry created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating yarn in entry:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create yarn in entry" },
      { status: 500 }
    );
  }
}

