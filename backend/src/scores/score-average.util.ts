export type ScoreDetailForAverage = {
  score: number;
  testType: {
    code: string;
  };
};

export function calculateSubjectAverage(
  scoreDetails: ScoreDetailForAverage[],
): number | null {
  const oralScores = scoreDetails
    .filter((detail) => detail.testType.code === 'ORAL_15M')
    .map((detail) => detail.score);
  const onePeriodScores = scoreDetails
    .filter((detail) => detail.testType.code === 'ONE_PERIOD')
    .map((detail) => detail.score);
  const midterm = scoreDetails.find(
    (detail) => detail.testType.code === 'MIDTERM',
  )?.score;
  const final = scoreDetails.find(
    (detail) => detail.testType.code === 'FINAL',
  )?.score;

  if (
    oralScores.length === 0 ||
    onePeriodScores.length === 0 ||
    midterm === undefined ||
    final === undefined
  ) {
    return null;
  }

  const avgOral =
    oralScores.reduce((sum, score) => sum + score, 0) / oralScores.length;
  const avgOnePeriod =
    onePeriodScores.reduce((sum, score) => sum + score, 0) /
    onePeriodScores.length;
  const subjectAverage =
    (avgOral * 1 + avgOnePeriod * 2 + midterm * 3 + final * 3) / 9;
  return Math.round(subjectAverage * 100) / 100;
}
