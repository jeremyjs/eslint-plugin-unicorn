'use strict';

const hasProp = (obj, prop) => obj && obj[prop];

const isIndexOfCallExpression = node => {
	if (node.type !== 'CallExpression') {
		return false;
	}

	const property = node.callee.property;

	return property.name === 'indexOf';
};

const isUnaryNotExpression = node => (
	node.type === 'UnaryExpression' && node.operator === '!'
);

const isNegativeOne = (operator, value) => operator === '-' && value === 1;

// const isPlainString = pattern => {

// }

const getSourceCode = (context, node) => (
	context.getSourceCode().text.slice(node.range[0], node.range[1])
);

const report = (context, node, target, pattern) => {
	const targetSource = getSourceCode(context, target);
	const patternSource = getSourceCode(context, pattern);
	context.report({
		node,
		message: 'Use `.includes()` when checking for existence.',
		fix: fixer => fixer.replaceText(node, `${targetSource}.includes(${patternSource})`)
	});
};

const reportRegex = (context, node, target, pattern) => {
	const targetSource = getSourceCode(context, target);
	context.report({
		node,
		message: 'Use `.includes()` when checking for existence.',
		fix: fixer => fixer.replaceText(node, `${targetSource}.includes('${pattern}')`)
	});
};

const create = context => ({
	BinaryExpression: node => {
		const left = node.left;
		const right = node.right;

		if (isIndexOfCallExpression(left)) {
			const target = left.callee.object;
			const pattern = left.arguments[0];

			if (right.type === 'UnaryExpression') {
				const argument = right.argument;

				if (argument.type !== 'Literal') {
					return false;
				}

				const value = argument.value;

				if (node.operator === '!==' && isNegativeOne(right.operator, value)) {
					report(context, node, target, pattern);
				}
				if (node.operator === '!=' && isNegativeOne(right.operator, value)) {
					report(context, node, target, pattern);
				}
				if (node.operator === '>' && isNegativeOne(right.operator, value)) {
					report(context, node, target, pattern);
				}
			}

			if (right.type !== 'Literal') {
				return false;
			}

			if (node.operator === '>=' && right.value === 0) {
				report(context, node, target, pattern);
			}

			return false;
		}

		if (isUnaryNotExpression(left)) {
			const argument = left.argument;

			if (isIndexOfCallExpression(argument)) {
				const target = argument.callee.object;
				const pattern = argument.arguments[0];

				if (right.type === 'UnaryExpression') {
					const argument = right.argument;

					if (argument.type !== 'Literal') {
						return false;
					}

					const value = argument.value;

					if (node.operator === '===' && isNegativeOne(right.operator, value)) {
						report(context, node, target, pattern);
					}
					if (node.operator === '==' && isNegativeOne(right.operator, value)) {
						report(context, node, target, pattern);
					}
				}

				if (right.type !== 'Literal') {
					return false;
				}

				if (node.operator === '<' && right.value === 0) {
					report(context, node, target, pattern);
				}

				return false;
			}
		}
	},

	// CallExpression: node => {
	// 	const callee = node.callee;

	// 	if (callee.type !== 'MemberExpression' || callee.property.name !== 'test') {
	// 		return false;
	// 	}

	// 	const object = callee.object;

	// 	if (object.type !== 'Literal' || !hasProp(object.regex, 'pattern')) {
	// 		return false;
	// 	}

	// 	const target = node.arguments[0];
	// 	const pattern = object.regex.pattern;

	// 	if (!isPlainString(pattern)) {
	// 		return false
	// 	}

	// 	reportRegex(context, node, target, pattern);
	// }
});

module.exports = {
	create,
	meta: {
		fixable: 'code'
	}
};
