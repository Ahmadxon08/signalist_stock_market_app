import { connectToDatabase } from "@/database/mongoose";

export const getAllUsersFromNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Mongoose connection is not connected");

    const users = await db
      .collection("user")
      .find(
        { email: { $exist: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();
    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user._id.toString() || user.id || "",
        email: user.email,
        name: user.name,
      }));
  } catch (error) {
    console.error("error", error);
  }
};
