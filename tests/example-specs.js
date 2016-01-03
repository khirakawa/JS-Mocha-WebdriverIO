require('colors');

var webdriverio = require('webdriverio'),
    _ = require("lodash"),
    chai = require("chai"),
    assert = chai.assert,
    chaiAsPromised = require("chai-as-promised"),
    user = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY,
    tunnelId = 'test-tunnel-id',
    SauceLabs = require("saucelabs"),
    saucelabs = new SauceLabs({
        username: user,
        password: accessKey
    }),
    DESIREDS = {
        chrome: {
            browserName: 'chrome',
            platform: 'OS X 10.10',
            version: '45.0',
            tunnelIdentifier: tunnelId
        },
    },
    browserKey = process.env.BROWSER || 'chrome',
    desired = DESIREDS[browserKey],
    sauceConfig = {
        desiredCapabilities: desired,
        host: "ondemand.saucelabs.com",
        port: 80,
        user: user,
        key: accessKey,
        logLevel: "silent"
    },
    sauceConnectLauncher = require('sauce-connect-launcher'),
    sauceConnectProcess;

chai.should();
chai.use(chaiAsPromised);

// building desired capability
desired.name = 'example with ' + browserKey;
desired.tags = ['tutorial'];

describe('   mocha spec examples (' + desired.browserName + ')', function() {
    var client = {},
        allPassed = true,
        name = "";

    this.timeout(60000);

    after(function(done) {
        sauceConnectProcess.close(function() {
            console.log("Closed Sauce Connect process");
            done();
        });
    });

    before(function(done) {
        sauceConnectLauncher({
            username: user,
            accessKey: accessKey,
            tunnelIdentifier: tunnelId,
            verbose: true,
            verboseDebugging: true,
            logger: console.log
        }, function(err, process) {
            if (err) {
                console.log("errored out");
                console.error(err.message);
                done();
                return;
            }
            console.log("Sauce Connect ready");

            sauceConnectProcess = process;

            done();
        });
    });

    beforeEach(function(done) {
        client = webdriverio.remote(sauceConfig);

        chaiAsPromised.transferPromiseness = client.transferPromiseness;
        client.init(done);
    });

    afterEach(function(done, res) {
        allPassed = allPassed && (this.currentTest.state === 'passed');

        // update sauce labs job
        saucelabs.updateJob(client.requestHandler.sessionID, {
            name: name,
            passed: allPassed
        }, function() {});

        client.end(done);
    });

    it("load playstation.com", function(done) {
        name = this.test.fullTitle();
        client
            .url("http://localhost:8008")
            .click('#link-to-playstation')
            .getUrl()
            .should
            .eventually
            .be
            .equal("https://www.playstation.com/en-us/")
            .and.notify(done);
    });

});
