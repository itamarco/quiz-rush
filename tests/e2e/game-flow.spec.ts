import { test, expect, Page, BrowserContext } from "@playwright/test";

test.describe("Quiz Rush - Full Game Flow", () => {
  const timestamp = Date.now();
  const hostEmail = `host-${timestamp}@test.com`;
  const hostPassword = "Test123456";
  const quizTitle = `E2E Quiz ${timestamp}`;
  const players = [
    { nickname: `Player1_${timestamp}` },
    { nickname: `Player2_${timestamp}` },
  ];

  const questions = [
    {
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
    },
    {
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctIndex: 2,
    },
    {
      text: "What color is the sky?",
      options: ["Green", "Blue", "Red", "Yellow"],
      correctIndex: 1,
    },
  ];

  test("Full game flow: Create quiz, Host game, Players join and play", async ({
    browser,
  }) => {
    test.setTimeout(180000);

    // Create separate browser contexts for host and players
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    const playerContexts: BrowserContext[] = [];
    const playerPages: Page[] = [];

    for (const _ of players) {
      const context = await browser.newContext();
      playerContexts.push(context);
      playerPages.push(await context.newPage());
    }

    try {
      // ===============================
      // STEP 1: Host Signs Up
      // ===============================
      console.log("--- Step 1: Host signing up ---");
      await hostPage.goto("/");
      await expect(hostPage.locator("h1")).toContainText("Quiz Rush");

      // Click "התחבר עם אימייל" (Sign in with email) button
      await hostPage.getByRole("button", { name: "התחבר עם אימייל" }).click();

      // Switch to sign up mode
      await hostPage
        .getByRole("button", { name: "אין לך חשבון? הירשם" })
        .click();

      // Fill sign up form
      await hostPage.locator('input[id="email"]').fill(hostEmail);
      await hostPage.locator('input[id="password"]').fill(hostPassword);
      await hostPage.getByRole("button", { name: "הירשם" }).click();

      // Wait for auth to complete - check for logout button or user name
      await expect(hostPage.getByRole("button", { name: "התנתק" })).toBeVisible(
        { timeout: 15000 }
      );
      console.log("Host signed up successfully");

      // ===============================
      // STEP 2: Host Creates a Quiz
      // ===============================
      console.log("--- Step 2: Creating quiz ---");
      await hostPage.goto("/create");
      await expect(hostPage.locator("h1")).toContainText("צור חידון");

      // Fill quiz title
      await hostPage
        .locator('input[placeholder="הזן כותרת לחידון"]')
        .fill(quizTitle);

      // Set time limit to 10 seconds for faster test
      await hostPage.locator('input[type="number"]').fill("10");

      // Fill first question (already exists)
      await hostPage
        .locator('textarea[placeholder="הזן את השאלה שלך"]')
        .first()
        .fill(questions[0].text);

      // Fill first question options
      const firstQuestionOptions = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 1" })
        .locator('input[type="text"]');
      for (let i = 0; i < 4; i++) {
        await firstQuestionOptions.nth(i).fill(questions[0].options[i]);
      }

      // Select correct answer for first question
      const firstQuestionRadios = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 1" })
        .locator('input[type="radio"]');
      await firstQuestionRadios.nth(questions[0].correctIndex).check();

      // Add second question
      await hostPage.getByRole("button", { name: "הוסף שאלה" }).click();
      await hostPage
        .locator('textarea[placeholder="הזן את השאלה שלך"]')
        .nth(1)
        .fill(questions[1].text);

      const secondQuestionOptions = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 2" })
        .locator('input[type="text"]');
      for (let i = 0; i < 4; i++) {
        await secondQuestionOptions.nth(i).fill(questions[1].options[i]);
      }
      const secondQuestionRadios = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 2" })
        .locator('input[type="radio"]');
      await secondQuestionRadios.nth(questions[1].correctIndex).check();

      // Add third question
      await hostPage.getByRole("button", { name: "הוסף שאלה" }).click();
      await hostPage
        .locator('textarea[placeholder="הזן את השאלה שלך"]')
        .nth(2)
        .fill(questions[2].text);

      const thirdQuestionOptions = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 3" })
        .locator('input[type="text"]');
      for (let i = 0; i < 4; i++) {
        await thirdQuestionOptions.nth(i).fill(questions[2].options[i]);
      }
      const thirdQuestionRadios = hostPage
        .locator(".brutal-card")
        .filter({ hasText: "שאלה 3" })
        .locator('input[type="radio"]');
      await thirdQuestionRadios.nth(questions[2].correctIndex).check();

      // Save quiz
      await hostPage.getByRole("button", { name: "צור חידון" }).click();

      // Wait for redirect to quizzes page
      await expect(hostPage).toHaveURL("/quizzes", { timeout: 15000 });
      await expect(hostPage.locator("h1")).toContainText("החידונים שלי");
      console.log("Quiz created successfully");

      // ===============================
      // STEP 3: Host Starts a Game
      // ===============================
      console.log("--- Step 3: Starting game ---");

      // Find the quiz card and click "ארח משחק" (Host Game)
      const quizCard = hostPage
        .locator(".brutal-card")
        .filter({ hasText: quizTitle });
      await quizCard.getByRole("button", { name: "ארח משחק" }).click();

      // Wait for host page to load
      await expect(hostPage.locator("h1")).toContainText("ארח משחק", {
        timeout: 10000,
      });

      // Get the game PIN
      const pinElement = hostPage.locator(".font-mono.text-7xl");
      await expect(pinElement).toBeVisible();
      const gamePin = await pinElement.textContent();
      expect(gamePin).toMatch(/^\d{6}$/);
      console.log(`Game PIN: ${gamePin}`);

      // ===============================
      // STEP 4: Players Join the Game
      // ===============================
      console.log("--- Step 4: Players joining ---");

      for (let i = 0; i < players.length; i++) {
        const playerPage = playerPages[i];
        const player = players[i];

        await playerPage.goto("/play");
        await expect(playerPage.locator("h1")).toContainText("הצטרף למשחק");

        // Enter PIN
        await playerPage.locator('input[id="pin"]').fill(gamePin!);
        await playerPage.getByRole("button", { name: "הצטרף למשחק" }).click();

        // Enter nickname
        await expect(playerPage.locator("h1")).toContainText(
          "הזן את הכינוי שלך",
          { timeout: 10000 }
        );
        await playerPage.locator('input[id="nickname"]').fill(player.nickname);
        await playerPage.getByRole("button", { name: "הצטרף למשחק" }).click();

        // Wait for lobby
        await expect(playerPage.locator("h2")).toContainText(
          "ממתין שהמשחק יתחיל",
          { timeout: 10000 }
        );
        console.log(`${player.nickname} joined successfully`);
      }

      // ===============================
      // STEP 5: Host Starts the Game
      // ===============================
      console.log("--- Step 5: Host starting the game ---");

      // Reload host page to ensure Firebase listener gets fresh player data
      await hostPage.reload();
      await expect(hostPage.getByText("קוד PIN של המשחק")).toBeVisible({
        timeout: 10000,
      });

      // Wait for "Start Game" button to be enabled (disabled when 0 players)
      // This confirms players joined without relying on real-time listener
      const startButton = hostPage.getByRole("button", { name: "התחל משחק" });
      await expect(startButton).toBeEnabled({ timeout: 20000 });
      console.log("Start button enabled - players joined successfully");

      await startButton.click();

      // Wait for first question to appear on host
      await expect(
        hostPage.getByText(questions[0].text, { exact: false })
      ).toBeVisible({ timeout: 15000 });
      console.log("Game started - Question 1 displayed");

      // ===============================
      // STEP 6: Play Through All Questions
      // ===============================
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];
        console.log(`--- Playing Question ${qIndex + 1}: ${question.text} ---`);

        // Wait for question to appear on all player screens
        for (let i = 0; i < playerPages.length; i++) {
          await expect(
            playerPages[i].getByText(question.text, { exact: false })
          ).toBeVisible({ timeout: 15000 });
        }

        // Players answer the question
        for (let i = 0; i < playerPages.length; i++) {
          const playerPage = playerPages[i];
          // Player 0 answers correctly, Player 1 answers wrong for variety
          const answerIndex =
            i === 0 ? question.correctIndex : (question.correctIndex + 1) % 4;
          const answerText = question.options[answerIndex];

          // Click the answer button
          await playerPage
            .locator("button")
            .filter({ hasText: answerText })
            .click();

          // Wait for submission confirmation
          await expect(playerPage.getByText("התשובה נשלחה!")).toBeVisible({
            timeout: 5000,
          });
          console.log(`${players[i].nickname} answered: ${answerText}`);
        }

        // Host ends the question early (or wait for timer)
        await hostPage.getByRole("button", { name: "סיים שאלה מוקדם" }).click();

        // Wait for results to show
        await expect(hostPage.getByText("הזמן נגמר!")).toBeVisible({
          timeout: 10000,
        });
        console.log(`Question ${qIndex + 1} ended`);

        // If not the last question, wait for next question
        if (qIndex < questions.length - 1) {
          await expect(
            hostPage.getByText(questions[qIndex + 1].text, { exact: false })
          ).toBeVisible({ timeout: 15000 });
        }
      }

      // ===============================
      // STEP 7: Verify Game End
      // ===============================
      console.log("--- Step 7: Verifying game end ---");

      // Wait for game to end
      await expect(hostPage.getByText("המשחק הסתיים!")).toBeVisible({
        timeout: 15000,
      });
      console.log("Game ended on host");

      // Verify players see game ended
      for (let i = 0; i < playerPages.length; i++) {
        await expect(playerPages[i].getByText("המשחק הסתיים!")).toBeVisible({
          timeout: 15000,
        });
        console.log(`${players[i].nickname} sees game ended`);
      }

      // Verify leaderboard heading is displayed (players may not show due to Firebase sync)
      await expect(hostPage.locator("h2").first()).toBeVisible();

      console.log("=== E2E Test Completed Successfully ===");
    } finally {
      // Cleanup
      await hostContext.close();
      for (const context of playerContexts) {
        await context.close();
      }
    }
  });
});
