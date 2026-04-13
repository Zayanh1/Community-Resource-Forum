"use server";

import { cache } from "react";
import { db } from "../db";

const getAllTags = cache(async () => {
  return await db.query.tags.findMany();
});

export default getAllTags;
