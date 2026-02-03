import mongoose from "mongoose";

const toJsonOptions = {
  virtuals: true,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
  },
};

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sourceUrl: { type: String, default: null },
    sheetData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: toJsonOptions }
);

const ChartSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    includeInsights: { type: Boolean, default: false },
    chartConfig: { type: mongoose.Schema.Types.Mixed, required: true },
    dashboardLayout: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, toJSON: toJsonOptions }
);

const GlobalDashboardItemSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    chartId: { type: String, required: true },
    layout: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: toJsonOptions }
);

ProjectSchema.virtual("id").get(function (this: mongoose.Document) {
  return this._id.toString();
});

ChartSchema.virtual("id").get(function (this: mongoose.Document) {
  return this._id.toString();
});

GlobalDashboardItemSchema.virtual("id").get(function (this: mongoose.Document) {
  return this._id.toString();
});

export const ProjectModel =
  mongoose.models?.Project ?? mongoose.model("Project", ProjectSchema);
export const ChartModel =
  mongoose.models?.Chart ?? mongoose.model("Chart", ChartSchema);
export const GlobalDashboardItemModel =
  mongoose.models?.GlobalDashboardItem ??
  mongoose.model("GlobalDashboardItem", GlobalDashboardItemSchema);
