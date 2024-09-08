import mongoose from "mongoose";
import ecbWeightHistorical from "./ecbWeightHistorical.model.js";

const ecbWeightCurrentSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type:String, required: true },
    sysArduinoWeight: { type: Number, required: true },
  },
  { timestamps: true }
);

ecbWeightCurrentSchema.pre("save", async function (next) {
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

      // Fetch the historical data
      let historicalData;
      if (this.userFedSex === "M") {
        historicalData = await ecbWeightHistorical.findOne({
          avgMarketAge: this.userFedAge,
        });
        if (historicalData) {
          this.sysAvgExpectedWeight = historicalData.maleTop50PercentileWeight;
        }
      } else if (this.userFedSex === "F") {
        historicalData = await ecbWeightHistorical.findOne({
          avgMarketAge: this.userFedAge,
        });
        if (historicalData) {
          this.sysAvgExpectedWeight =
            historicalData.femaleTop50PercentileWeight;
        }
      }
      next();
    } catch (err) {
      return next(err);
    }
  } else {
    next();
  }
});

const ecbWeightCurrent = mongoose.model(
  "EcbWeightCurrent",
  ecbWeightCurrentSchema
);

export default ecbWeightCurrent;
