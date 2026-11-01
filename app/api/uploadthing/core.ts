import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const uploadRouter = {
  // Multiple images for a single tyre - admin only
  tyreImages: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      try {
        // Use req.headers directly — next/headers() does NOT work inside UploadThing middleware
        const session = await auth.api.getSession({
          headers: req.headers,
        });

        console.log("[UploadThing] session:", session?.user?.id ?? "null");

        if (!session?.user) throw new Error("Unauthorized");

        // Check admin role
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });

        console.log("[UploadThing] user role:", user?.role ?? "not found");

        if (user?.role !== "ADMIN") throw new Error("Admin access required");

        return { userId: session.user.id };
      } catch (err) {
        console.error("[UploadThing] middleware error:", err);
        throw err;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] upload complete, userId:", metadata.userId, "url:", file.ufsUrl ?? file.url);
      return {
        url: file.ufsUrl ?? file.url,
        fileKey: file.key,
        name: file.name,
        size: file.size,
      };
    }),

  // Secondhand tyre photos — public (no auth required)
  secondhandPhotos: f({
    image: { maxFileSize: "8MB", maxFileCount: 8 },
  })
    .middleware(async () => {
      // Public route — no authentication needed
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("[UploadThing] secondhand photo uploaded:", file.ufsUrl ?? file.url);
      return {
        url: file.ufsUrl ?? file.url,
        fileKey: file.key,
        name: file.name,
      };
    }),
} satisfies FileRouter;


export type OurFileRouter = typeof uploadRouter;
