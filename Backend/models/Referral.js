// Updated Referral.js Model with Dynamic Category Validation

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referralId: {
      type: String,
      unique: true,
      // NOTE: NOT required because it's auto-generated in pre-save hook
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["Elementary", "JHS", "SHS"],
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    referralDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "For Consultation", "Complete"],
      default: "Pending",
    },
    category: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: async function(value) {
          // Allow empty/null values since category is optional
          if (!value || value === '') return true;
          
          // Check if category exists in Categories collection
          const Category = mongoose.model('Category');
          const categoryExists = await Category.findOne({ 
            name: value,
            isActive: true // Only validate against active categories
          });
          
          return !!categoryExists;
        },
        message: props => `Category "${props.value}" is not a valid category. Please select from available categories.`
      }
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Generate referralId before saving (ONLY for new documents)
referralSchema.pre("save", async function (next) {
  // Only generate referralId if this is a new document and doesn't have one
  if (this.isNew && !this.referralId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    // Count referrals created today to get sequence number
    const count = await mongoose.model("Referral").countDocuments({
      referralId: new RegExp(`^REF-${dateStr}-`),
    });

    const sequence = String(count + 1).padStart(3, "0");
    this.referralId = `REF-${dateStr}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model("Referral", referralSchema);