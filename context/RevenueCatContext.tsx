import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

interface RevenueCatContextValue {
  isConfigured: boolean;
  loading: boolean;
  isPremium: boolean;
  error: string | null;
  offering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;
  refreshOfferings: () => Promise<void>;
  purchaseMonthly: () => Promise<boolean>;
  purchaseYearly: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  presentDashboardPaywall: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(
  undefined
);

// Put RevenueCat PUBLIC SDK keys in .env.
// iOS key must start with "appl_" and Android key must start with "goog_".
const IOS_REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const ANDROID_REVENUECAT_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

// Entitlement identifier created in RevenueCat dashboard, e.g. "premium".
const ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "premium";
let purchasesConfigured = false;

const isPlaceholderRevenueCatKey = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your_public_sdk_key_here") ||
    normalized.includes("replace_me") ||
    normalized.includes("example")
  );
};

const isRevenueCatKeyFormatValid = (
  value: string,
  platform: "ios" | "android"
): boolean => {
  if (isPlaceholderRevenueCatKey(value)) return false;
  return platform === "ios"
    ? value.startsWith("appl_")
    : value.startsWith("goog_");
};

const getSelectedPackage = (
  offering: PurchasesOffering | null,
  target: "MONTHLY" | "ANNUAL"
): PurchasesPackage | null => {
  if (!offering) return null;

  const directMonthly = (offering as any).monthly as PurchasesPackage | null;
  const directAnnual = (offering as any).annual as PurchasesPackage | null;
  if (target === "MONTHLY" && directMonthly) return directMonthly;
  if (target === "ANNUAL" && directAnnual) return directAnnual;

  const byType = offering.availablePackages.find((pkg) => {
    const packageType = String((pkg as any).packageType ?? "");
    if (target === "MONTHLY") return packageType.includes("MONTHLY");
    return packageType.includes("ANNUAL");
  });
  if (byType) return byType;

  const byIdentifier = offering.availablePackages.find((pkg) => {
    const identifier = pkg.product.identifier.toLowerCase();
    if (target === "MONTHLY") return identifier.includes("month");
    return identifier.includes("year") || identifier.includes("annual");
  });
  return byIdentifier ?? null;
};

const resolvePremiumFromCustomerInfo = (customerInfo: CustomerInfo): boolean => {
  // Entitlement status is tracked from RevenueCat customer info.
  const activeEntitlements = customerInfo.entitlements.active;
  if (ENTITLEMENT_ID in activeEntitlements) {
    return Boolean(activeEntitlements[ENTITLEMENT_ID]);
  }
  return Object.keys(activeEntitlements).length > 0;
};

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSignedIn, userId } = useAuth();
  const previousSignedInRef = useRef<boolean>(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(
    null
  );
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(
    null
  );
  const paywallPresentingRef = useRef(false);

  const syncEntitlement = useCallback((customerInfo: CustomerInfo) => {
    setIsPremium(resolvePremiumFromCustomerInfo(customerInfo));
  }, []);

  const refreshOfferings = useCallback(async () => {
    if (Platform.OS === "ios" && !Device.isDevice) {
      setOffering(null);
      setMonthlyPackage(null);
      setYearlyPackage(null);
      setError(
        "Subscriptions are unavailable on iOS simulator without StoreKit testing. Use a real device with Sandbox account, or add a StoreKit config file."
      );
      return;
    }

    try {
      if (__DEV__) {
        console.log("Bundle ID:", Constants.expoConfig?.ios?.bundleIdentifier);
        console.log("RC configured:", !!Purchases);
      }

      const offerings = await Purchases.getOfferings();
      if (__DEV__) {
        console.log("Current offering:", offerings.current?.identifier);
        console.log(
          "Packages:",
          offerings.current?.availablePackages?.map(
            (p) => p.product.identifier
          )
        );
      }
      // Offerings are fetched from RevenueCat dashboard products/packages.
      const currentOffering = offerings.current ?? null;
      setOffering(currentOffering);
      setMonthlyPackage(getSelectedPackage(currentOffering, "MONTHLY"));
      setYearlyPackage(getSelectedPackage(currentOffering, "ANNUAL"));
      setError(null);
    } catch (offeringError) {
      setError(
        offeringError instanceof Error
          ? offeringError.message
          : "Failed to load subscription offerings."
      );
    }
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      syncEntitlement(customerInfo);
      setError(null);
    } catch (customerInfoError) {
      setError(
        customerInfoError instanceof Error
          ? customerInfoError.message
          : "Failed to load subscription status."
      );
    }
  }, [syncEntitlement]);

  useEffect(() => {
    let mounted = true;

    const initializeRevenueCat = async () => {
      setLoading(true);
      try {
        const isExpoGo = Constants.appOwnership === "expo";
        if (isExpoGo) {
          if (mounted) {
            setIsConfigured(false);
            setError(
              "RevenueCat requires a development build or production build (not Expo Go)."
            );
          }
          return;
        }

        const keyPlatform = Platform.OS === "ios" ? "ios" : "android";
        const apiKey =
          keyPlatform === "ios" ? IOS_REVENUECAT_KEY : ANDROID_REVENUECAT_KEY;
        const envVarName =
          keyPlatform === "ios"
            ? "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
            : "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY";

        if (!isRevenueCatKeyFormatValid(apiKey, keyPlatform)) {
          if (mounted) {
            setIsConfigured(false);
            setError(
              `Invalid RevenueCat key for ${keyPlatform}. Set ${envVarName} to your public SDK key (${keyPlatform === "ios" ? "appl_" : "goog_"}...).`
            );
          }
          return;
        }

        Purchases.setLogLevel(
          __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR
        );
        if (!purchasesConfigured) {
          await Purchases.configure({ apiKey });
          purchasesConfigured = true;
        }

        if (!mounted) return;
        setIsConfigured(true);
        await Promise.all([refreshCustomerInfo(), refreshOfferings()]);
      } catch (initError) {
        if (mounted) {
          setIsConfigured(false);
          setError(
            initError instanceof Error
              ? initError.message
              : "Failed to initialize RevenueCat."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeRevenueCat();
    return () => {
      mounted = false;
    };
  }, [refreshCustomerInfo, refreshOfferings]);

  useEffect(() => {
    const listener = (customerInfo: CustomerInfo) => {
      // Purchase/restore updates arrive here and keep premium state in sync.
      syncEntitlement(customerInfo);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    } catch {
      return undefined;
    }
  }, [syncEntitlement]);

  useEffect(() => {
    if (!isConfigured) return;

    const syncUserIdentity = async () => {
      try {
        if (isSignedIn && userId) {
          await Purchases.logIn(userId);
          previousSignedInRef.current = true;
        } else if (previousSignedInRef.current) {
          await Purchases.logOut();
          previousSignedInRef.current = false;
        }
        await refreshCustomerInfo();
      } catch (identityError) {
        setError(
          identityError instanceof Error
            ? identityError.message
            : "Failed to sync subscription identity."
        );
      }
    };

    syncUserIdentity().catch(() => {
      // Error is handled in syncUserIdentity.
    });
  }, [isConfigured, isSignedIn, refreshCustomerInfo, userId]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage | null): Promise<boolean> => {
      if (!pkg) {
        setError("Selected subscription package is not available.");
        return false;
      }

      setLoading(true);
      try {
        // Purchase response contains customer info used to evaluate entitlement.
        const purchaseResult = await Purchases.purchasePackage(pkg);
        syncEntitlement(purchaseResult.customerInfo);
        setError(null);
        return true;
      } catch (purchaseError: any) {
        if (purchaseError?.userCancelled) {
          return false;
        }
        setError(
          purchaseError instanceof Error
            ? purchaseError.message
            : "Purchase failed."
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [syncEntitlement]
  );

  const purchaseMonthly = useCallback(async () => {
    return purchasePackage(monthlyPackage);
  }, [monthlyPackage, purchasePackage]);

  const purchaseYearly = useCallback(async () => {
    return purchasePackage(yearlyPackage);
  }, [purchasePackage, yearlyPackage]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      syncEntitlement(customerInfo);
      setError(null);
      return true;
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Failed to restore purchases."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [syncEntitlement]);

  const presentDashboardPaywall = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      setError("Subscriptions are not configured yet.");
      return false;
    }

    if (paywallPresentingRef.current) {
      return false;
    }

    if (isPremium) {
      return true;
    }

    paywallPresentingRef.current = true;
    setLoading(true);

    try {
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = resolvePremiumFromCustomerInfo(customerInfo);
      syncEntitlement(customerInfo);
      setError(null);
      return hasPremium;
    } catch (paywallError) {
      setError(
        paywallError instanceof Error
          ? paywallError.message
          : "Failed to present subscription paywall."
      );
      return false;
    } finally {
      paywallPresentingRef.current = false;
      setLoading(false);
    }
  }, [isConfigured, isPremium, syncEntitlement]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      isConfigured,
      loading,
      isPremium,
      error,
      offering,
      monthlyPackage,
      yearlyPackage,
      refreshOfferings,
      purchaseMonthly,
      purchaseYearly,
      restorePurchases,
      presentDashboardPaywall,
    }),
    [
      error,
      isConfigured,
      isPremium,
      loading,
      monthlyPackage,
      offering,
      purchaseMonthly,
      purchaseYearly,
      presentDashboardPaywall,
      refreshOfferings,
      restorePurchases,
      yearlyPackage,
    ]
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = (): RevenueCatContextValue => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCat must be used within RevenueCatProvider.");
  }
  return context;
};
