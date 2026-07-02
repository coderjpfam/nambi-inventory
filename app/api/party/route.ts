import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Party from "@/models/Party";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { findUserByEmail } from "@/lib/db";

// GET - List all parties
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
    const parties = await Party.find()
      .sort({ createdAt: -1 })
      .lean();

    // Get unique creator emails
    const creatorEmails = [...new Set(parties.map((party) => party.createdBy))];
    
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
        data: parties.map((party) => ({
          id: party._id.toString(),
          name: party.name,
          mobileNo: party.mobileNo,
          emailId: party.emailId,
          createdBy: party.createdBy,
          createdByName: userMap.get(party.createdBy) || party.createdBy,
          createdAt: party.createdAt,
          updatedAt: party.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching parties:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch parties" },
      { status: 500 }
    );
  }
}

// POST - Create new party
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
    const { name, mobileNo, emailId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedMobile = mobileNo?.trim();
    const trimmedEmail = emailId?.trim();

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { message: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const party = new Party({
      name: name.trim(),
      ...(trimmedMobile && { mobileNo: trimmedMobile }),
      ...(trimmedEmail && { emailId: trimmedEmail.toLowerCase() }),
      createdBy: user.email,
    });

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
        message: "Party created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating party:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A party with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Failed to create party" },
      { status: 500 }
    );
  }
}



