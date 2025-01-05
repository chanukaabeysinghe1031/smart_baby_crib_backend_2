import mongoose from "mongoose";

// Define the schema
const strollerStatusSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Unique identifier for the stroller
    mode: { type: String, default: "Manual" }, // Current mode of the stroller
    status: { type: String, default: "All good" }, // Status message
    distance: { type: Number, default: 0 }, // Distance covered
    gpsHistory: {
      type: [
        {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    }, // GPS coordinates history
    remote: { type: String, default: "phone" }, // Control type (phone or ring)
    halted: { type: Boolean, default: false }, // Distance tracking status
    temperature: { type: Number, default: null }, // Current temperature
    humidity: { type: Number, default: null }, // Current humidity
    steering: { type: Number, default: null }, // Steering value (-100 to 100),
    speed: { type: Number, default: null }, // Speed
    numberOfWalks: { type: Number, default: 0 },
    walkingStatus: { type: String, default: "IDLE" }, // walking status
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Middleware to ensure unique `strollerId` for new records
strollerStatusSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingRecord = await this.constructor.findOne({
      userId: this.userId,
    });
    if (existingRecord) {
      return next(new Error("User ID must be unique"));
    }
  }
  next();
});

// Create the model
const StrollerStatus = mongoose.model("StrollerStatus", strollerStatusSchema);

export default StrollerStatus;
