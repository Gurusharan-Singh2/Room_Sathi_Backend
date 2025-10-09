import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  rent: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["room_available", "room_needed"],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: String,
  images: [String],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

// for geo queries (like nearby search)
roomSchema.index({ location: "2dsphere" });

const Room = mongoose.model("Room", roomSchema);
export default Room;
