var config = require('./config');
var request = require('./node_modules/sync-request');

exports.handler = function (event, context) {

    var started = Date.now();

    if (event.domain === undefined) {
        return context.fail(JSON.stringify(config.errors.error400));
    }

    var domain = event.domain;
    
    var businessUnitId = getBusinessUnitId(domain);
    if (businessUnitId === null) {
        return context.fail(JSON.stringify(config.errors.error404));
    }
    
    var reviews       = getDomainReviews(businessUnitId, config.challenge.maxReviews);
    var ratingReport  = produceRatingReport(reviews, started);

    return context.succeed(ratingReport);

    function getBusinessUnitId(domain) {
        var res = request(
            'GET',
            'https://api.trustpilot.com/v1/business-units/find?name=' + domain,
            {
                'headers': {
                    'apikey': config.trustpilot.apikey
                }
            }
        );

        if (res.statusCode === 404) {
            return null;
        }
        
        return JSON.parse(res.getBody('utf-8')).id;
    }

    function getDomainReviews(domainId, maxReviews) {
        // Calculate how many fetches are needed
        var chunks = Math.ceil(maxReviews / config.trustpilot.maxPerPage);
        
        // Fetch reviews
        reviews = [];
        for (var i = 0; i < chunks; i++) {
            pageReviews = getDomainReviewsChunk(domainId, config.trustpilot.maxPerPage, i + 1);
            
            // No reason to continue if we reached the end or reviews
            if (pageReviews.length === 0) {
                break;
            }
            reviews = reviews.concat(pageReviews);
        }

        return reviews;
    }

    function getDomainReviewsChunk(domainId, perPage, page) {
        var res = request(
            'GET',
            'https://api.trustpilot.com/v1/business-units/' + domainId + '/reviews?perPage=' + perPage + '&page=' + page,
            {
                'headers': {
                    'apikey': config.trustpilot.apikey
                }
            }
        );
        // Do some cleaning: omit properties that are not needed
        var reviews = JSON.parse(res.getBody('utf-8')).reviews;

        reviews = reviews.map(function (review) {
            return {
                stars: review.stars,
                createdAt: review.createdAt
            };
        });

        return reviews;
    }

    /*
    * Logic for calculation:
    * Persina ksina stafilia: A Greek expression that directly translates to "Last year's old grapes",
    * and is used to express the idea that what happened long ago has no significance.
    *
    * Based on that, I set my arbitrary limit for when ratings stop having any weight at 1 year.
    * Everything that happened less than 356 days from now, gets a weight relative to its proximity to now in days
    *
    * Example:
    *
    * 2 ratings:
    * {
    *   stars:3,
    *   daysAgo: 1
    * },
    * {
    *   stars:5,
    *   daysAgo: 2
    * }
    *
    * weightedSum = (3*365 + 5*364) / 2 + 365 + 364
    *
    * The fresher something is, the more weight it has on the result
    */
    function produceRatingReport(reviews, started) {
        var now         = Math.floor(Date.now() / 1000);
        var secsInDay   = 60 * 60 * 24;
        var weightedSum = 0;
        var divisor     = reviews.length;

        for (var i = 0, len = reviews.length; i < len; i++) {
            var review = reviews[i];

            // Get timestamp of review
            var createdAt = new Date(review.createdAt).getTime() / 1000;

            // Calculate age in days
            var daysAgo = Math.floor((now - createdAt) / secsInDay);

            // Skip old reviews
            if (daysAgo > 365) {
                continue;
            }
            
            // Add weight to sum and divisor
            var weight  = 365 - daysAgo;

            weightedSum = weightedSum + review.stars * weight;
            divisor = divisor + weight;
        }

        return {
            weighedAverage: weightedSum / divisor,
            reviews: reviews,
            meta: {
                time: (Date.now() - started) / 1000,
                author: config.challenge.author
            }
        }
    }
    
};

