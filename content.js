// conversion ratios
const conversions = {
	// distance
	'mile': { ratio: 1.60934, unit: 'km', plural: 'miles' },
	'foot': { ratio: 0.3048, unit: 'm', plural: 'feet' },
	'feet': { ratio: 0.3048, unit: 'm', plural: 'feet' },
	'inch': { ratio: 2.54, unit: 'cm', plural: 'inches' },
	'yard': { ratio: 0.9144, unit: 'm', plural: 'yards' },

	// weight
	'pound': { ratio: 0.453592, unit: 'kg', plural: 'pounds' },
	'ounce': { ratio: 28.3495, unit: 'g', plural: 'ounces' },
	'oz': { ratio: 28.3495, unit: 'g', plural: 'oz' },
	'lb': { ratio: 0.453592, unit: 'kg', plural: 'lbs' },

	// volume
	'gallon': { ratio: 3.78541, unit: 'L', plural: 'gallons' },
	'quart': { ratio: 0.946353, unit: 'L', plural: 'quarts' },
	'pint': { ratio: 0.473176, unit: 'L', plural: 'pints' },

	// temperature (special case)
	'fahrenheit': { ratio: null, unit: '°C', plural: 'fahrenheit' },
	'°f': { ratio: null, unit: '°C', plural: '°f' },
};

function convertImperial(text) {
	const pattern = /(\d+(?:\.\d+)?)\s*(miles?|feet|ft|inches?|in|yards?|yd|pounds?|lbs?|ounces?|oz|gallons?|gal|quarts?|qt|pints?|pt|°f|fahrenheit)\b/gi;
	const matches = [];
	let match;

	// collect all matches first
	while ((match = pattern.exec(text)) !== null) {
		matches.push({
			full: match[0],
			num: match[1],
			unit: match[2],
			index: match.index
		});
	}

	return { text, matches };
}

function replaceText(node) {
	if (node.nodeType === Node.TEXT_NODE) {
		const result = convertImperial(node.textContent);

		if (result.matches.length > 0) {
			const parent = node.parentNode;
			const fragment = document.createDocumentFragment();
			let lastIndex = 0;

			result.matches.forEach(m => {
				const unitLower = m.unit.toLowerCase();
				let conversion = conversions[unitLower];

				// handle abbreviations
				if (unitLower === 'ft') conversion = conversions['foot'];
				if (unitLower === 'in') conversion = conversions['inch'];
				if (unitLower === 'yd') conversion = conversions['yard'];
				if (unitLower === 'gal') conversion = conversions['gallon'];
				if (unitLower === 'qt') conversion = conversions['quart'];
				if (unitLower === 'pt') conversion = conversions['pint'];

				if (!conversion) return;

				const numVal = parseFloat(m.num);
				let converted;

				// special case for fahrenheit
				if (unitLower === '°f' || unitLower === 'fahrenheit') {
					converted = ((numVal - 32) * 5 / 9).toFixed(1);
				} else {
					converted = (numVal * conversion.ratio).toFixed(2);
				}

				// add text before match
				if (m.index > lastIndex) {
					fragment.appendChild(document.createTextNode(result.text.slice(lastIndex, m.index)));
				}

				// add strikethrough original
				const strike = document.createElement('span');
				strike.style.textDecoration = 'line-through';
				strike.textContent = m.full;
				fragment.appendChild(strike);

				// add metric conversion
				fragment.appendChild(document.createTextNode(` (${converted} ${conversion.unit})`));

				lastIndex = m.index + m.full.length;
			});

			// add remaining text
			if (lastIndex < result.text.length) {
				fragment.appendChild(document.createTextNode(result.text.slice(lastIndex)));
			}

			parent.replaceChild(fragment, node);
		}
	} else if (node.nodeType === Node.ELEMENT_NODE) {
		// skip script, style, and input elements
		if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(node.tagName)) {
			return;
		}
		for (let child of Array.from(node.childNodes)) {
			replaceText(child);
		}
	}
}

replaceText(document.body);

// watch for dynamic content
const observer = new MutationObserver(mutations => {
	mutations.forEach(mutation => {
		mutation.addedNodes.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
				replaceText(node);
			}
		});
	});
});

observer.observe(document.body, {
	childList: true,
	subtree: true
});
