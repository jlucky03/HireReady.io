import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const startInterviewSchema = z.object({
  body: z.object({
  topic: z
  .string()
  .trim()
  .min(2, "Topic is required")
  .refine(
    (value) =>
      value.startsWith("RESUME_DATA_STREAM:") || value.length <= 100,
    {
      message: "Topic is too long",
    }
  ),

    difficulty: z.enum(["easy", "medium", "hard"]),
  }),
});

export const submitAnswerSchema = z.object({
  body: z.object({
    interviewId: z
      .string()
      .regex(objectIdRegex, "Invalid interview ID"),

    answer: z
      .string()
      .trim()
      .min(1, "Answer is required")
      .max(5000, "Answer is too long"),
  }),
});