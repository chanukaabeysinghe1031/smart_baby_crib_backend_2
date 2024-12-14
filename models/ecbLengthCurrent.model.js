import mongoose from "mongoose";
import ecbLengthHistorical from "./ecbLengthHistorical.model.js";

const ecbLengthCurrentSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type: Number, required: true },
    sysArduinoLength: { type: Number, required: true },
    sysAvgExpectedLength: { type: Number },
    currentAge: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ecbLengthCurrentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const lastEntry = await this.constructor
        .findOne({ sysUserId: this.sysUserId })
        .sort({ etlSequenceNo: -1 });
      if (lastEntry) {
        this.etlSequenceNo = lastEntry.etlSequenceNo + 1;
      } else {
        this.etlSequenceNo = 1; // Start from 1 if no previous records are found for this user
      }
    } catch (err) {
      return next(err);
    }
  }

  // Fetch the historical data
  let historicalData;
  if (this.userFedSex === "M") {
    historicalData = await ecbLengthHistorical.findOne({
      avgMarketAge: this.userFedAge,
    });
    if (historicalData) {
      this.sysAvgExpectedLength = historicalData.avgHeightMale;
    }
  } else if (this.userFedSex === "F") {
    historicalData = await ecbLengthHistorical.findOne({
      avgMarketAge: this.userFedAge,
    });
    if (historicalData) {
      this.sysAvgExpectedLength = historicalData.avgHeightFemale;
    }
  }

  next();
});

const ecbLengthCurrent = mongoose.model(
  "EcbLengthCurrent",
  ecbLengthCurrentSchema
);

export default ecbLengthCurrent;
