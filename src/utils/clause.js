export function clauseMatch(clause, truth) {
	if (!clause)
			return true;

	for (let k in clause)
		if (clause[k]!=truth[k])
			return false;

	return true;
}