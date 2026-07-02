import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Party from "@/models/Party";
import { getAuthenticatedUser } from "@/lib/api-auth";
import mongoose from "mongoose";

// GET - Get single party by ID
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
        { message: "Invalid party ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const party = await Party.findById(id).lean();

    if (!party) {
      return NextResponse.json(
        { message: "Party not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: party._id.toString(),
          name: party.name,
          mobileNo: party.mobileNo,
          emailId: party.emailId,
          createdBy: party.createdBy,
          createdAt: party.createdAt,
          updatedAt: party.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching party:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch party" },
      { status: 500 }
    );
  }
}

// PUT - Update party
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
        { message: "Party ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid ObjectId format:", id);
      return NextResponse.json(
        { message: `Invalid party ID format: ${id}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, mobileNo, emailId } = body;

    await connectDB();
    const party = await Party.findById(id);

    if (!party) {
      return NextResponse.json(
        { message: "Party not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { message: "Name is required" },
          { status: 400 }
        );
      }
      party.name = name.trim();
    }
    if (mobileNo !== undefined) {
      const trimmedMobile = mobileNo?.trim();
      party.mobileNo = trimmedMobile || undefined;
    }
    if (emailId !== undefined) {
      const trimmedEmail = emailId?.trim();
      if (trimmedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return NextResponse.json(
            { message: "Invalid email format" },
            { status: 400 }
          );
        }
        party.emailId = trimmedEmail.toLowerCase();
      } else {
        party.emailId = undefined;
      }
    }

    await party.save();

    return NextResponse.json(
      {
        data: {
          id: party._id.toString(),
          name: party.name,
          mobileNo: party.mobileNo,
          emailId: party.emailId,
          createdBy: party.createdBy,
          createdAt: party.createdAt,
          updatedAt: party.updatedAt,
        },
        message: "Party updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating party:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A party with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Failed to update party" },
      { status: 500 }
    );
  }
}

// DELETE - Delete party
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
        { message: "Invalid party ID" },
        { status: 400 }
      );
    }

    await connectDB();
    const party = await Party.findByIdAndDelete(id);

    if (!party) {
      return NextResponse.json(
        { message: "Party not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Party deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting party:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete party" },
      { status: 500 }
    );
  }
}



