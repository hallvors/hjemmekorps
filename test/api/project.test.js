const env = require("../../config/environment");

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../../server");
const sClient = require("../../lib/sanity_client");

const HTOKEN = jwt.sign(
  { email: "hallvord@hallvord.com" },
  env.nconf.get("site:tokensecret")
);

describe("Projects API", function () {
  // We want to make sure the test dataset is in the state these tests expect
  // This means only one project, one member
  async function cleanup() {
    const client = sClient.getSanityClient();
    let results = await client.fetch(
      '*[_type == "project"]{name, _id, "sheetmusic": sheetmusic.asset->}'
    );
    let transaction = client.transaction();
    results.forEach(async (result) => {
      if (result.name !== "Test musikk 1") {
        console.log(result, result.sheetmusic);
        if (result.sheetmusic && result.sheetmusic._id) {
          await transaction.delete(result.sheetmusic._id);
        }
        await transaction.delete(result._id);
      }
    });
    results = await client.fetch('*[_type == "member"]{name, _id}');
    results.forEach(async (result) => {
      if (result.name !== "Testmusikant1") {
        await transaction.delete(result._id);
      }
    });
    transaction.commit();
  }

  beforeAll(cleanup);
  afterAll(cleanup);

  it("listing projects - not authorized", function () {
    return request(app)
      .get("/api/projects")
      .expect(302)
      .expect("Location", "/feil/tilgang");
  });

  it("listing projects - bad token", function () {
    return request(app)
      .get("/api/projects")
      .set("Cookie", "token=111")
      .expect(302)
      .expect("Location", "/feil/ukjent");
  });

  it("listing projects - correct token in cookie", function () {
    return request(app)
      .get("/api/projects")
      .set("Cookie", "token=" + HTOKEN)
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].name).toBe("Test musikk 1");
        expect(res.body[0].sheetmusic).toBeDefined();

        return Promise.resolve();
      });
  });

  it("get specific project", function () {
    return request(app)
      .get("/api/projects/80d2f2a9-69a3-4623-8bbe-e5c6b0842d2e")
      .set("Cookie", "token=" + HTOKEN)
      .expect(200)
      .then((res) => {
        console.log('res.body', res.body)
        expect(res.body.name).toBe("Test musikk 1");
        expect(res.body.sheetmusic).toBeDefined();
        expect(res.body.sheetmusicFile).toBeDefined();

        return Promise.resolve();
      });
  });

  it("create project by upload", function () {
    jest.setTimeout(10000);
    return request(app)
      .post("/api/projects/new")
      .set("Cookie", "token=" + HTOKEN)
      .attach("file", __dirname + "/../fixtures/Nu_grönskar_det.xml")
      .field("band", "Testmann Minnes skoles musikkorps")
      .expect(200)
      .then((res) => {
        console.log(res.body);
        expect(res.body.name).toBe("Nu grönskar det");
        expect(res.body.members).toHaveLength(18);
        expect(res.body.sheetmusicFile).toBeDefined();
        expect(res.body.members[0].name).toBeDefined();
        return Promise.resolve();
      });
  });
});
