"use server";

import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async ({
  email,
  fullName,
  password,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const res = await auth.api.signUpEmail({
      body: { email, name: fullName, password },
    });

    if (res) {
      await inngest.send({
        name: "app/user.created",
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          preferredIndustry,
          riskTolerance,
        },
      });
    }

    return { success: true, data: res };
  } catch (error) {
    console.log("Sign up failed", error);
    return { success: false, error: "Sign up failed" };
  }
};
