const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

const app = express();
const port = 7777;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

class User {
  constructor(id, name, major, mbti) {
    this.id = id;
    this.name = name;
    this.major = major;
    this.mbti = mbti;
  }

  static fromData(data, id) {
    return new User(id, data.name, data.major, data.mbti);
  }
}

class MBTICalculator {
  constructor() {
    this.mbtiData = {};
  }

  add(user) {
    const { major, mbti } = user;

    if (!this.mbtiData[major]) {
      this.mbtiData[major] = {};
    }

    if (!this.mbtiData[major][mbti]) {
      this.mbtiData[major][mbti] = 0;
    }

    this.mbtiData[major][mbti]++;
  }

  getTopMBTIForEachMajor() {
    const topMBTI = {};

    for (const major in this.mbtiData) {
      topMBTI[major] = Object.keys(this.mbtiData[major])
        .sort((a, b) => this.mbtiData[major][b] - this.mbtiData[major][a])
        .slice(0, 3);
    }

    return topMBTI;
  }
}

class MainController {
  static home(req, res) {
    res.sendFile(path.join(__dirname, "public", "main.html"));
  }
}

class InputController {
  static inputData(req, res) {
    res.sendFile(path.join(__dirname, "public", "inputData.html"));
  }

  static otherInput(req, res) {
    res.sendFile(path.join(__dirname, "public", "inputOther.html"));
  }
}

class OtherUserController {
  static otherData = {};

  static viewOther(req, res) {
    OtherUserController.otherData = req.body;
    console.log(req.body);
    res.sendFile(path.join(__dirname, "public", "otherStat.html"));
  }

  static getOtherUser(req, res) {
    console.log(OtherUserController.otherData);
    res.json(OtherUserController.otherData);
  }
}

class StatController {
  static async viewOther(req, res) {
    res.sendFile(path.join(__dirname, "public", "otherStat.html"));
  }

  static async viewStat(req, res) {
    const data = req.body;
    let users = await StatController.getData();

    if (users) {
      const newUser = User.fromData(data, users.length + 1);
      users.push(newUser);
      await StatController.saveData(users);
      res.sendFile(path.join(__dirname, "public", "viewStat.html"));
    } else {
      res.status(500).send("Internal Server Error");
    }
  }

  static async getData() {
    let existingData = [];
    try {
      const fileData = await fs.readFile("data.json");
      existingData = JSON.parse(fileData);
      existingData = existingData.map((data, index) =>
        User.fromData(data, index + 1)
      );
    } catch (err) {
      console.error(err);
    }
    return existingData;
  }

  static async saveData(users) {
    try {
      await fs.writeFile("data.json", JSON.stringify(users));
    } catch (err) {
      console.error(err);
    }
  }

  static async getUserInfo(req, res) {
    let users = await StatController.getData();

    if (users && users.length > 0) {
      const userInfo = users[users.length - 1];
      res.json(userInfo);
    } else {
      res.json({});
    }
  }

  static async getTopMBTI(req, res) {
    let users = await StatController.getData();

    if (users && users.length > 0) {
      const mbtiCalculator = new MBTICalculator();
      users.forEach(user => mbtiCalculator.add(user));

      const topMBTI = mbtiCalculator.getTopMBTIForEachMajor();
      res.json(topMBTI);
    } else {
      res.json({});
    }
  }
}

class ImageController {
  static async createImg(req, res) {
    let users = await StatController.getData();

    if (users && users.length > 0) {
      const userInfo = users[users.length - 1];
      const { mbti, major } = userInfo;

      exec(`python3 ImageProcessor.py ${mbti} ${major}`, error => {
        if (error) {
          console.error(error);
          res.status(500).send("Internal Server Error");
        } else {
          res.sendStatus(200);
        }
      });
    } else {
      res.send("No user data found");
    }
  }

  static resultImg(req, res) {
    res.sendFile(path.join(__dirname, "result.jpg"));
  }
}

// Routes
app.get("/", MainController.home);
app.get("/inputData", InputController.inputData);
app.get("/otherInput", InputController.otherInput);
app.post("/viewStat", StatController.viewStat);
app.get("/getUserInfo", StatController.getUserInfo);
app.get("/getTopMBTI", StatController.getTopMBTI);
app.post("/createImg", ImageController.createImg);
app.get("/resultImg", ImageController.resultImg);
app.post("/viewOther", OtherUserController.viewOther);
app.post("/viewOther", StatController.viewOther);
app.get("/getOtherUser", OtherUserController.getOtherUser);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
