class NextRequest {
  constructor(input) {
    if (input && input.url) {
      this.url = input.url;
    } else {
      this.url = String(input || 'http://localhost');
    }
  }
  async json() {
    return {};
  }
}

const NextResponse = {
  json(body, opts = {}) {
    return {
      json: async () => body,
      status: opts.status || 200
    };
  }
};

module.exports = { NextRequest, NextResponse };

