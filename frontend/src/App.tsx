import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

import Landing from "./screens/landing";


import "@/index.css";
import Test from "./screens/canvas/test";
import SignInPage from "./screens/sign-in/sign-in";
import SignUpPage from "./screens/sign-up/sign-up";

const paths = [
  {
    path: '/',
    element: (
      <Landing/>
    ),
  },
  {
    path: '/canvas',
    element: <Test />,
  },
  { path: "/sign-in", element: <SignInPage /> },
  { path: "/sign-up", element: <SignUpPage /> },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
  return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter}/>
    </MantineProvider>
  );
}

export default App;