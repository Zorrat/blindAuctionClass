const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Counter Contract", function () {
    let Counter;
    let counter;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // Deploying the contract before each test
        Counter = await ethers.getContractFactory("Counter");
        [owner, addr1, addr2] = await ethers.getSigners();
        counter = await Counter.deploy();
        await counter.deployed();
    });

    it("Should initialize with the value set by the organizer", async function () {
        // Only the organizer (owner) can set the initial value
        await counter.initialize(10);
        expect(await counter.value()).to.equal(10);
    });

    it("Should prevent non-organizers from initializing the counter", async function () {
        // Attempting initialization from a non-organizer account
        await expect(counter.connect(addr1).initialize(10)).to.be.revertedWith("Only the organizer can perform this action.");
    });

    it("Should increment the counter value", async function () {
        // Initializing the counter first
        await counter.initialize(10);
        // Incrementing the counter
        await counter.increment(5);
        expect(await counter.value()).to.equal(15);
    });

    it("Should decrement the counter value", async function () {
        // Initializing and decrementing the counter
        await counter.initialize(10);
        await counter.decrement(3);
        expect(await counter.value()).to.equal(7);
    });
});
