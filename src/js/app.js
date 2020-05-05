App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  hasVoted: false,
  isOpen: true,

  init: function () {
    console.log("init");
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    console.log("initweb3");

    if (typeof web3 !== "undefined") {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://127.0.0.1:8545"
      );
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    console.log("initContract");

    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    console.log("listenforevents");

    App.contracts.Election.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance
        .votedEvent(
          {},
          {
            fromBlock: 0,
            toBlock: "latest",
          }
        )
        .watch(function (error, event) {
          console.log("event triggered", event);
          // Reload when a new vote is recorded
          //App.render();
        });
    });
  },

  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var results = $("#results");

    var admin_choices = $("#admin-choices");

    loader.show();
    content.hide();

    // Load account data
    console.log("render");

    web3.eth.getAccounts(function (error, accounts) {
      // console.log(accounts);

      // $("#accountAddress").html("Your Account: " + accounts[0]);
      App.account = accounts[0];
    });

    // Load contract data
    App.contracts.Election.deployed()
      .then(function (instance) {
        console.log("get count");

        electionInstance = instance;
        electionInstance.isOpen().then(function (openStatus) {
          if (openStatus) {
            results.hide();
          } else {
            results.show();
          }
        });

        electionInstance.admin().then(function (admin_address) {
            console.log("admin is "+admin_address)
            console.log("curr acc is " + App.account)
          if (App.account == admin_address) {
            admin_choices.show();
          } else {
            admin_choices.hide();
          }
        });

        return electionInstance.candidatesCount();
      })
      .then(function (candidatesCount) {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();

        var candidatesSelect = $("#candidatesSelect");
        candidatesSelect.empty();

        for (var i = 1; i <= candidatesCount; i++) {
          electionInstance.candidates(i).then(function (candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];

            // Render candidate Result
            var candidateTemplate =
              "<tr><th>" +
              id +
              "</th><td>" +
              name +
              "</td><td>" +
              voteCount +
              "</td></tr>";
            candidatesResults.append(candidateTemplate);

            // Render candidate ballot option
            var candidateOption =
              "<option value='" + id + "' >" + name + "</ option>";
            candidatesSelect.append(candidateOption);
          });
        }
        return electionInstance.voters(App.account);
      })
      .then(function (hasVoted) {
        console.log("voted  check");

        // Do not allow a user to vote
        if (hasVoted) {
          $("vote-form").hide();
        } else {
          $("vote-form").show();
        }
        loader.hide();
        content.show();
      })
      .catch(function (error) {
        console.warn(error);
      });
  },

  castVote: function () {
    var candidateId = $("#candidatesSelect").val();
    App.contracts.Election.deployed()
      .then(function (instance) {
        return instance.vote(candidateId, { from: App.account });
      })
      .then(function (result) {
        // Wait for votes to update
        // $("#content").hide();
        // $("#loader").show();
        location.reload();
      })
      .catch(function (err) {
        console.error(err);
      });
  },

  closeElection: function () {
    App.contracts.Election.deployed()
      .then(function (instance) {
        console.log("Closing election");
        return instance.closeElection({ from: App.account });
      })
      .then(function () {
        // Wait for votes to update
        // $("#content").hide();
        // $("#loader").show();
        location.reload();
      })
      .catch(function (err) {
        console.error(err);
      });
  },
  openElection: function () {
    App.contracts.Election.deployed()
      .then(function (instance) {
        console.log("Opening election");
        return instance.openElection({ from: App.account });
      })
      .then(function () {
        // Wait for votes to update
        // $("#content").hide();
        // $("#loader").show();
        location.reload();
      })
      .catch(function (err) {
        console.error(err);
      });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
