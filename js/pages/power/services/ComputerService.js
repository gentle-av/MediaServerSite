export class ComputerService {
  constructor(api) {
    this.api = api;
  }

  async sleep() {
    const response = await this.api.post("/api/system/sleep");
    return response;
  }
}
