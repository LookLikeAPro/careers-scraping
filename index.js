#!/usr/bin/env node

var request = require("request");
var cheerio = require("cheerio");
var urlJoin = require("url-join");
var google = require("google");

function fetch(url) {
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, html) {
			if (!error && response.statusCode >= 200 && response.statusCode < 300) {
				resolve(html);
			}
			else {
				console.log("fucked up "+url);
				throw "Fetch failed";
			}
		});
	});
}

function convert(base_url, currentUrl) {
	if (!currentUrl || /^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(currentUrl)) {
		return currentUrl;
	}
	return urlJoin(base_url, currentUrl);
}

function run(keyword) {
	function findWebsite(keyword) {
		return new Promise((resolve, reject) => {
			google(keyword, function(err, res) {
				resolve(res.links[0].href);
			});
		});
	}
	function scrapeCareerLink(url) {
		return fetch(url).then(function(html) {
			var $ = cheerio.load(html);
			return new Promise((resolve, reject) => {
				let promises = [];
				$("a:contains('Career'), a:contains('career'), a:contains('Job'), a:contains('job')").each(function(i, element) {
					// var a = $(this).prev();
					// console.log(this.attribs.href);
					promises.push(this.attribs.href);
				});
				resolve(promises);
			});
		}).then(function(links) {
			if (links.length === 0) {
				return null;
			}
			return links[0];
		});
	}
	function scrapeSite(url) {
		return scrapeCareerLink(url).then(function(link) {
			// console.log(link);
			const careerLink = convert(url, link);
			console.log("Found Careers / Jobs link: "+careerLink);
			return fetch(careerLink).then(function(html) {
				var $ = cheerio.load(html);
				return new Promise((resolve, reject) => {
					let promises = [];
					let results = {opening: [], jobs: []};
					$("a:contains('open'), a:contains('position')").each(function(i, element) {
						// var a = $(this).prev();
						results.opening.push(this.attribs.href);
					});
					$("a:contains('Engineer'), a:contains('engineer'), a:contains('Software'), a:contains('software'), a:contains('Intern'), a:contains('intern')").each(function(i, element) {
						// var a = $(this).prev();
						results.jobs.push({title: $(this).text(), link: this.attribs.href});
					});
					resolve(results);
				});
			}).then(function(results) {
				if (results.opening.length > 0) {
					const openingLink = convert(url, results.opening[0]);
					console.log("Found openings link: "+openingLink);
				}
				console.log("Found jobs: ");
				for (let i=0; i<results.jobs.length; i++) {
					console.log(results.jobs[i].title);
				}
			});
		});
	}
	findWebsite(keyword).then(scrapeSite).then(function() {
		// console.log("DONE");
	});
}

function main() {
	var queue = [];
	process.argv.forEach(function (val, index, array) {
		if (index >= 2) {
			queue.push(val);
		}
	});
	queue.forEach(function(item) {
		run(item);
	});
}

main();

// run("heroku");



