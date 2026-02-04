const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAOQuestionnaire", function () {
  let questionnaire;
  let owner, voter1, voter2, voter3, candidate1, candidate2;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, candidate1, candidate2] = await ethers.getSigners();

    const DAOQuestionnaire = await ethers.getContractFactory("DAOQuestionnaire");
    questionnaire = await DAOQuestionnaire.deploy();
    await questionnaire.waitForDeployment();
  });

  describe("Phase Management", function () {
    it("starts in Inactive phase", async function () {
      expect(await questionnaire.currentPhase()).to.equal(0); // Inactive
    });

    it("owner can change phase", async function () {
      await questionnaire.setPhase(1); // Nomination
      expect(await questionnaire.currentPhase()).to.equal(1);
    });

    it("non-owner cannot change phase", async function () {
      await expect(questionnaire.connect(voter1).setPhase(1)).to.be.revertedWith("Not owner");
    });
  });

  describe("Nominations", function () {
    beforeEach(async function () {
      await questionnaire.setPhase(1); // Nomination
    });

    it("allows nominating a candidate", async function () {
      await expect(
        questionnaire.connect(voter1).nominate(candidate1.address, "Great candidate for signer role")
      )
        .to.emit(questionnaire, "CandidateNominated")
        .withArgs(candidate1.address, voter1.address, "Great candidate for signer role");

      expect(await questionnaire.isNominated(candidate1.address)).to.be.true;
      expect(await questionnaire.getNominationCount()).to.equal(1);
    });

    it("prevents duplicate nominations", async function () {
      await questionnaire.connect(voter1).nominate(candidate1.address, "Good candidate");
      await expect(
        questionnaire.connect(voter2).nominate(candidate1.address, "Also good")
      ).to.be.revertedWith("Already nominated");
    });

    it("allows withdrawing nomination", async function () {
      await questionnaire.connect(voter1).nominate(candidate1.address, "Good candidate");
      await questionnaire.connect(voter1).withdrawNomination(0);
      expect(await questionnaire.isNominated(candidate1.address)).to.be.false;
    });

    it("only nominator can withdraw", async function () {
      await questionnaire.connect(voter1).nominate(candidate1.address, "Good candidate");
      await expect(
        questionnaire.connect(voter2).withdrawNomination(0)
      ).to.be.revertedWith("Not nominator");
    });

    it("rejects nominations in wrong phase", async function () {
      await questionnaire.setPhase(0); // Inactive
      await expect(
        questionnaire.connect(voter1).nominate(candidate1.address, "Good")
      ).to.be.revertedWith("Wrong phase");
    });

    it("rejects empty statements", async function () {
      await expect(
        questionnaire.connect(voter1).nominate(candidate1.address, "")
      ).to.be.revertedWith("Empty statement");
    });

    it("returns active nominations", async function () {
      await questionnaire.connect(voter1).nominate(candidate1.address, "Candidate 1");
      await questionnaire.connect(voter2).nominate(candidate2.address, "Candidate 2");
      await questionnaire.connect(voter1).withdrawNomination(0);

      const active = await questionnaire.getActiveNominations();
      expect(active.length).to.equal(1);
      expect(active[0].candidate).to.equal(candidate2.address);
    });
  });

  describe("Assessments", function () {
    beforeEach(async function () {
      await questionnaire.setPhase(1); // Nomination
      await questionnaire.connect(voter1).nominate(candidate1.address, "Candidate 1");
      await questionnaire.connect(voter2).nominate(candidate2.address, "Candidate 2");
      await questionnaire.setPhase(2); // Assessment
    });

    it("allows assessing a candidate with valid scores", async function () {
      await expect(
        questionnaire.connect(voter1).assessCandidate(
          candidate2.address,
          [40, 25, 15, 20],
          "Strong technical skills"
        )
      )
        .to.emit(questionnaire, "CandidateAssessed")
        .withArgs(candidate2.address, voter1.address, [40, 25, 15, 20]);
    });

    it("requires scores to total 100", async function () {
      await expect(
        questionnaire.connect(voter1).assessCandidate(
          candidate2.address,
          [30, 25, 15, 20],
          "Bad total"
        )
      ).to.be.revertedWith("Scores must total 100");
    });

    it("requires minimum 5 per trait", async function () {
      await expect(
        questionnaire.connect(voter1).assessCandidate(
          candidate2.address,
          [90, 5, 4, 1],
          "Bad min"
        )
      ).to.be.revertedWith("Min 5 points per trait");
    });

    it("prevents self-assessment", async function () {
      await expect(
        questionnaire.connect(candidate1).assessCandidate(
          candidate1.address,
          [25, 25, 25, 25],
          "Self"
        )
      ).to.be.revertedWith("Cannot assess yourself");
    });

    it("prevents duplicate assessment", async function () {
      await questionnaire.connect(voter1).assessCandidate(
        candidate2.address,
        [25, 25, 25, 25],
        "First"
      );
      await expect(
        questionnaire.connect(voter1).assessCandidate(
          candidate2.address,
          [30, 30, 20, 20],
          "Duplicate"
        )
      ).to.be.revertedWith("Already assessed this candidate");
    });

    it("enforces 69-char feedback limit", async function () {
      const longFeedback = "A".repeat(70);
      await expect(
        questionnaire.connect(voter1).assessCandidate(
          candidate2.address,
          [25, 25, 25, 25],
          longFeedback
        )
      ).to.be.revertedWith("Feedback too long (69 max)");
    });

    it("allows empty feedback", async function () {
      await questionnaire.connect(voter1).assessCandidate(
        candidate2.address,
        [25, 25, 25, 25],
        ""
      );
      expect(await questionnaire.getAssessorCount(candidate2.address)).to.equal(1);
    });
  });

  describe("Score Aggregation", function () {
    beforeEach(async function () {
      await questionnaire.setPhase(1);
      await questionnaire.connect(voter1).nominate(candidate1.address, "Candidate 1");
      await questionnaire.setPhase(2);
    });

    it("calculates median scores correctly with odd count", async function () {
      await questionnaire.connect(voter1).assessCandidate(candidate1.address, [40, 25, 15, 20], "");
      await questionnaire.connect(voter2).assessCandidate(candidate1.address, [30, 30, 20, 20], "");
      await questionnaire.connect(voter3).assessCandidate(candidate1.address, [50, 20, 10, 20], "");

      const [medianScores, totalScore, count] = await questionnaire.getAggregatedScores(candidate1.address);

      // Median of [40,30,50]=40, [25,30,20]=25, [15,20,10]=15, [20,20,20]=20
      expect(medianScores[0]).to.equal(40);
      expect(medianScores[1]).to.equal(25);
      expect(medianScores[2]).to.equal(15);
      expect(medianScores[3]).to.equal(20);
      expect(totalScore).to.equal(100);
      expect(count).to.equal(3);
    });

    it("returns zeros for unassessed candidate", async function () {
      const [medianScores, totalScore, count] = await questionnaire.getAggregatedScores(candidate1.address);
      expect(totalScore).to.equal(0);
      expect(count).to.equal(0);
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      await questionnaire.setPhase(1);
      await questionnaire.connect(voter1).nominate(candidate1.address, "Candidate 1");
      await questionnaire.connect(voter2).nominate(candidate2.address, "Candidate 2");
      await questionnaire.setPhase(2);

      // Candidate1 gets higher scores
      await questionnaire.connect(voter2).assessCandidate(candidate1.address, [40, 25, 15, 20], "");
      await questionnaire.connect(voter3).assessCandidate(candidate1.address, [35, 30, 15, 20], "");

      // Candidate2 gets lower scores
      await questionnaire.connect(voter1).assessCandidate(candidate2.address, [20, 30, 25, 25], "");
      await questionnaire.connect(voter3).assessCandidate(candidate2.address, [25, 25, 25, 25], "");
    });

    it("returns leaderboard sorted by total score", async function () {
      const [candidates, scores, totals] = await questionnaire.getLeaderboard();

      expect(candidates.length).to.equal(2);
      // Candidate1 should be first (higher scores)
      expect(candidates[0]).to.equal(candidate1.address);
      expect(totals[0]).to.be.gte(totals[1]);
    });
  });

  describe("Feedback", function () {
    beforeEach(async function () {
      await questionnaire.setPhase(1);
      await questionnaire.connect(voter1).nominate(candidate1.address, "Candidate 1");
      await questionnaire.setPhase(2);
    });

    it("returns all feedback for a candidate", async function () {
      await questionnaire.connect(voter2).assessCandidate(
        candidate1.address,
        [25, 25, 25, 25],
        "Good leader"
      );
      await questionnaire.connect(voter3).assessCandidate(
        candidate1.address,
        [30, 30, 20, 20],
        "Strong skills"
      );

      const feedbacks = await questionnaire.getFeedback(candidate1.address);
      expect(feedbacks.length).to.equal(2);
      expect(feedbacks[0]).to.equal("Good leader");
      expect(feedbacks[1]).to.equal("Strong skills");
    });
  });

  describe("Ownership", function () {
    it("deployer is owner", async function () {
      expect(await questionnaire.owner()).to.equal(owner.address);
    });

    it("owner can transfer ownership", async function () {
      await questionnaire.transferOwnership(voter1.address);
      expect(await questionnaire.owner()).to.equal(voter1.address);
    });

    it("cannot transfer to zero address", async function () {
      await expect(
        questionnaire.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });
  });
});
