const https = require('https');
const URL_LIST = 'https://restcountries.eu/rest/v2/all';
const INFECTED_LIST = 'https://www.cdc.gov/coronavirus/2019-ncov/locations-confirmed-cases.html';
const fs = require('fs');
const countries = require('./countries.json');
const cheerio = require('cheerio');

const all = () => {
	https.get(URL_LIST, resp => {
		let data = '';
		resp.on('data', chunk => data += chunk);
		resp.on('end', () => fs.writeFileSync('./countries.json', data));
	});
};

const country_names = countries.map(country => {
	const names = country.name.split(',').map(name => name.trim());
	if(names[1]){
		names[1] = `(${names[1]})`;
	}

	return names.join(' ')
});

const infected_countries = () => {
	const list = data => {
		const $ = cheerio.load(data);
		return Array.from($('.list-unstyled.cc-md-2 li')).map(a => $(a).html());
	};

	return new Promise((resolve) => {
		https.get(INFECTED_LIST, resp => {
			let data = '';
			resp.on('data', chunk => data += chunk);
			resp.on('end', () => resolve(list(data)));
		});
	});
};

const uninfected_countries = async () => {
	const infected = await infected_countries()
	return country_names.filter(country => infected.findIndex(el => new RegExp(el, 'gi').exec(country)) === -1 );
}

const collated = async () => {
	const uninfected = await uninfected_countries();
	const infected = await infected_countries()
	
	console.log('------------------UNINFECTED COUNTRIES-------------------------');
	console.log(uninfected.join(', '));
	console.log('\n\n-------------------INFECTED COUNTRIES------------------------');
	console.log(infected.join(', '));

	console.log('\n\n------------------UNINFECTED COUNTRIES TOTAL-------------------------');
	console.log(uninfected.length);
	console.log('\n\n-------------------INFECTED CONTRIES TOTAL------------------------');
	console.log(infected.length);
}

collated();