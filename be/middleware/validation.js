const { z } = require('zod');

// Validate date format (must be YYYY-MM-DD or a valid Date string)
const dateSchema = z.string().refine((val) => {
    if (val === 'Never donated') return true;
    const parsed = Date.parse(val);
    return !isNaN(parsed);
}, {
    message: "Invalid date format. Must be a valid date or 'Never donated'."
});

const donationCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    bloodType: z.string().min(1, "Blood type is required"),
    age: z.number().min(18, "Age must be at least 18").max(65, "Age must be at most 65"),
    willingToDonate: z.boolean(),
    lastDonationDate: dateSchema,
    studentType: z.enum(['student', 'not-student']),
    year: z.number().optional().nullable(),
    section: z.string().optional().nullable(),
    address: z.string().optional().nullable()
});

const donationUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    bloodType: z.string().min(1).optional(),
    age: z.number().min(18).max(65).optional(),
    willingToDonate: z.boolean().optional(),
    lastDonationDate: dateSchema.optional(),
    studentType: z.enum(['student', 'not-student']).optional(),
    year: z.number().optional().nullable(),
    section: z.string().optional().nullable(),
    address: z.string().optional().nullable()
});

const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    donationCreateSchema,
    donationUpdateSchema,
    validateBody,
    dateSchema
};
