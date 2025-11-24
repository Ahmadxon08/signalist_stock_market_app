import { getNews } from "../actions/finnhub.actions";
import { getAllUsersFromNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { sendWelcomeEmail } from "../nodemailer";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
    -Country: ${event.data.country}
    -Investment goal: ${event.data.investmentGoals}
    -Risk tolerance: ${event.data.riskTolerance}
    -Prefered industry: ${event.data.preferredIndustry}
    `;
    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );
    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-light" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });
    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const intoText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining our comminity. Now you have a tool for keeping track of moves and making smart decision";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: intoText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 ***" }],
  async ({ step }) => {
    // get all users

    const users = await step.run("get-all-users", getAllUsersFromNewsEmail);
    if (!users || users?.length === 0)
      return { success: false, message: "No user found for news email" };

    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
      }> = [];

      for (const user of users as UserForNewsEmail[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          let articles = await getNews(symbols);

          articles = (articles || []).slice(0, 6);

          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }

          // Add to results
          perUser.push({
            user,
            articles,
          });
        } catch (error) {
          console.error(`Failed to fetch news for user ${user.email}:`, error);
          perUser.push({
            user,
            articles: [],
          });
        }
      }

      return perUser;
    });
  }
);
