export const transformExperiencesByRound = (data) => {
  if (!data) return {};
  const rounds = {};
  
  data.forEach((exp) => {
    exp.rounds.forEach(round => {
      const roundNum = round.roundNumber;
      if (!rounds[roundNum]) {
        rounds[roundNum] = [];
      }
      
      // Push without experienceId first — we'll number per-round below
      rounds[roundNum].push({
        _id: exp._id, // Critical for backend updates!
        roundNumber: roundNum,
        role: exp.role,
        upvotes: exp.totalUpvotes || 0,
        overview: round.notes || round.overview || "No detailed overview provided for this round.",
        questions: round.questions.map(q => {
          if (typeof q === 'string') return { text: q, solveLink: '' };
          if (q && q.text) return q;
          // Repair logic for corrupted objects with numerical keys
          const parts = Object.keys(q || {})
            .filter(k => !isNaN(k))
            .sort((a, b) => Number(a) - Number(b))
            .map(k => q[k]);
          return { text: parts.length > 0 ? parts.join('') : '', solveLink: q.solveLink || '' };
        })
      });
    });
  });
  
  // Sort rounds numerically and assign sequential per-round experience IDs
  const sortedRounds = {};
  Object.keys(rounds)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(key => {
      // Number each experience within this round starting from 01
      sortedRounds[key] = rounds[key].map((exp, idx) => ({
        ...exp,
        experienceId: `Experience ${String(idx + 1).padStart(2, '0')}`
      }));
    });
    
  return sortedRounds;
};
