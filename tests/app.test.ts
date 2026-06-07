import request from "supertest";
import app from "../app.ts";

describe("app", () => {
  it("returns 404 for an unknown route", async () => {
    const response = await request(app).get("/no-route");
    expect(response.status).toBe(404);
  });

  it("returns 404 for the root path when no route is defined", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(404);
  });
});
