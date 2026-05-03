import { runLighthouse } from '../lighthouse/runner.js';
import { transformReport } from '../lighthouse/transformer.js';
import { detectStack } from '../ai/stack-detector.js';
import { generateFix } from '../ai/fix-generator.js';
import { Report } from '../models/Report.js';
import { History } from '../models/History.js';

export const resolvers = {
  Query: {
    getReport: async (_parent, { id }) => {
      const doc = await Report.findOne({ id }).lean();
      return doc ?? null;
    },
    getHistory: async (_parent, { url }) => {
      return History.find({ url }).sort({ createdAt: -1 }).limit(10).lean();
    },
  },

  Mutation: {
    analyzeWebsite: async (_parent, { url }) => {
      const [lighthouseResult, techStack] = await Promise.all([
        runLighthouse(url),
        detectStack(url),
      ]);

      const report = transformReport(url, lighthouseResult);
      const createdAt = new Date().toISOString();
      const finalReport = { ...report, techStack, createdAt };

      await new Report(finalReport).save();
      await new History({
        id: finalReport.id,
        url,
        mobileScore: finalReport.mobileScore,
        desktopScore: finalReport.desktopScore,
        createdAt,
      }).save();

      return finalReport;
    },

    generateFix: async (_parent, { title, description, displayValue, techStack }) => {
      return generateFix({ title, description, displayValue }, techStack);
    },
  },
};
