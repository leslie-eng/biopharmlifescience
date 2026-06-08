import { Navigate } from "react-router-dom";

/** Legacy `/auth` URL redirects shoppers to the customer portal. */
const Auth = () => <Navigate to="/account" replace />;

export default Auth;
