import axios from 'axios';
import {
  StyleSheet,
  Image,
  Text,
  View,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";

import React, { useState } from "react";
import { colors, network } from "../../constants";
import CustomInput from "../../components/CustomInput";
import header_logo from "../../assets/logo/logo.png";
import CustomButton from "../../components/CustomButton";
import CustomAlert from "../../components/CustomAlert/CustomAlert";
import ProgressDialog from "react-native-progress-dialog";
import InternetConnectionAlert from "react-native-internet-connection-alert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTracker } from '@snowplow/react-native-tracker';
import { COLLECTOR_URL } from '../../utils';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isloading, setIsloading] = useState(false);

   const tracker = createTracker(
    'appTracker',
    {
      endpoint: COLLECTOR_URL,
      method: 'post',
      customPostPath: 'com.snowplowanalytics.snowplow/tp2', // A custom path which will be added to the endpoint URL to specify the complete URL of the collector when paired with the POST method.
      requestHeaders: {} // Custom headers for HTTP requests to the Collector
    }
    ,
    {
      trackerConfig: {
        appId: Platform.OS === 'ios' ? 'ecomm-ios' : "ecomm-android",
        devicePlatform: 'mob',
        base64Encoding: true,
        logLevel: 'off',
        applicationContext: true,
        platformContext: true,
        geoLocationContext: false,
        sessionContext: true,
        deepLinkContext: true,
        screenContext: true,
        screenViewAutotracking: true,
        lifecycleAutotracking: true,
        installAutotracking: true,
        exceptionAutotracking: true,
        diagnosticAutotracking: false,
        userAnonymisation: false // Whether to anonymise client-side user identifiers in session and platform context entities
      }
    }
  );

  //method to store the authUser to aync storage
  _storeData = async (user) => {
    try {
      AsyncStorage.setItem("authUser", JSON.stringify(user));
    } catch (error) {
      console.log(error);
      setError(error);
    }
  };

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = {
    email: email,
    password: password,
  };

  var requestOptions = {
    headers: myHeaders,
    method: 'post', // The HTTP method (e.g., 'get', 'post', 'put', 'delete', etc.)
    url: `${network.serverip}/login`, // The URL you want to send the request to
    data: raw
  };

  //method to validate the user credentials and navigate to Home Screen / Dashboard
  const loginHandle = () => {
    setIsloading(true);
    //[check validation] -- Start
    // if email does not contain @ sign
    if (email == "") {
      setIsloading(false);
      return setError("Please enter your email");
    }
    if (password == "") {
      setIsloading(false);
      return setError("Please enter your password");
    }
    if (!email.includes("@")) {
      setIsloading(false);
      return setError("Email is not valid");
    }
    // length of email must be greater than 5 characters
    if (email.length < 6) {
      setIsloading(false);
      return setError("Email is too short");
    }
    // length of password must be greater than 5 characters
    if (password.length < 6) {
      setIsloading(false);
      return setError("Password must be 6 characters long");
    }
    //[check validation] -- End


    axios(requestOptions) // Assuming you want to make a POST request
      .then((response) => {
        console.log("response>>>>>>>>>>>>", response)
        const result = response.data;
        if (
          result.status === 200 ||
          (result.status === 1 && result.success !== false)
        ) {
          if (result?.data?.userType === "ADMIN") {
            // Check the user type; if it is ADMIN, navigate to the Dashboard. Otherwise, navigate to User Home.
            _storeData(result.data);
            setIsloading(false);
            navigation.replace("dashboard", { authUser: result.data }); // Navigate to Admin Dashboard
          } else {
            _storeData(result.data);
            tracker.trackSelfDescribingEvent({
              schema: 'iglu:com.proemsportsanalytics.snowplow/login/jsonschema/1-0-0',
              data: { email: email, password: password }
            });
            setIsloading(false);
            console.log(result.data._id)
            navigation.replace("tab", { user: result.data }); // Navigate to User Dashboard
          }
        } else {
          setIsloading(false);
          return setError(result.message);
        }
      })
      .catch((error) => {
        setIsloading(false);
        console.log("error>>>>>>>>>>>>>>>>", error.config, error.message);
      });

  };

  return (
    <InternetConnectionAlert onChange={(connectionState) => { }}>
      <KeyboardAvoidingView
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={{ flex: 1, width: "100%" }}>
          <ProgressDialog visible={isloading} label={"Login ..."} />
          <StatusBar></StatusBar>
          <View style={styles.welconeContainer}>
            <View>
              <Text style={styles.welcomeText}>Welcome to EasyBuy</Text>
              <Text style={styles.welcomeParagraph}>
                make your ecommerce easy
              </Text>
            </View>
            <View>
              <Image style={styles.logo} source={header_logo} />
            </View>
          </View>
          <View style={styles.screenNameContainer}>
            <Text style={styles.screenNameText}>Login</Text>
          </View>
          <View style={styles.formContainer}>
            <CustomAlert message={error} type={"error"} />
            <CustomInput
              value={email}
              setValue={setEmail}
              placeholder={"Username"}
              placeholderTextColor={colors.muted}
              radius={5}
            />
            <CustomInput
              value={password}
              setValue={setPassword}
              secureTextEntry={true}
              placeholder={"Password"}
              placeholderTextColor={colors.muted}
              radius={5}
            />
            <View style={styles.forgetPasswordContainer}>
              <Text
                onPress={() => navigation.navigate("forgetpassword")}
                style={styles.ForgetText}
              >
                Forget Password?
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttomContainer}>
          <CustomButton text={"Login"} onPress={loginHandle} />
        </View>
        <View style={styles.bottomContainer}>
          <Text>Don't have an account?</Text>
          <Text
            onPress={() => navigation.navigate("signup")}
            style={styles.signupText}
          >
            signup
          </Text>
        </View>
      </KeyboardAvoidingView>
    </InternetConnectionAlert>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirecion: "row",
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    flex: 1,
  },
  welconeContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: "30%",
    // padding:15
  },
  formContainer: {
    flex: 3,
    justifyContent: "flex-start",
    alignItems: "center",
    display: "flex",
    width: "100%",
    flexDirecion: "row",
    padding: 5,
  },
  logo: {
    resizeMode: "contain",
    width: 80,
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: "bold",
    color: colors.muted,
  },
  welcomeParagraph: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.primary_shadow,
  },
  forgetPasswordContainer: {
    marginTop: 10,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  ForgetText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttomContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  bottomContainer: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    marginLeft: 2,
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  screenNameContainer: {
    marginTop: 10,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  screenNameText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.muted,
  },
});
