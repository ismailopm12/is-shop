import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Diamond, Coins } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import uidTopup from "@/assets/uid-topup.jpg";
import unipinVoucher from "@/assets/unipin-voucher.jpg";
import weeklyMonthly from "@/assets/weekly-monthly.jpg";

const localImageMap: Record<string, string> = {
  "uid-topup": uidTopup,
  "unipin-voucher": unipinVoucher,
  "weekly-monthly": weeklyMonthly,
};

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  category: string;
  description: string | null;
  is_voucher: boolean;
}

interface ProductVariant {
  id: string;
  name?: string;
  value: string;
  price: number;
  reward_coins?: number;
  isFromDiamondPackages?: boolean; // Track if variant comes from diamond_packages table
}

const ProductDetail = () => {
  const { slug } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "instant" | "coin">("instant");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [coinValue, setCoinValue] = useState<number>(0.10); // Default 1 coin = ৳0.10

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, slug, image, image_url, category, description, is_voucher")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (prod) {
        setProduct(prod as Product);

        // Fetch coin settings
        const { data: coinSettings } = await supabase
          .from("coin_settings")
          .select("coin_value")
          .single();
        
        if (coinSettings) {
          setCoinValue(parseFloat(coinSettings.coin_value.toString()));
        }

        // Try to fetch product_variants first (new system)
        const { data: vars, error: variantsError } = await supabase
          .from("product_variants")
          .select("id, name, value, price, reward_coins")
          .eq("product_id", prod.id)
          .eq("is_active", true)
          .order("sort_order");
        
        console.log("=== VARIANT FETCH DEBUG ===");
        console.log("Fetched product_variants:", vars);
        console.log("Error:", variantsError);
        console.log("Product ID:", prod.id);
        console.log("Number of variants found:", vars?.length || 0);
        if (vars && vars.length > 0) {
          console.log("First variant:", vars[0]);
          console.log("Has reward_coins field?", 'reward_coins' in vars[0]);
          console.log("Reward coins value:", vars[0]?.reward_coins);
        }
        console.log("=========================");
        
        if (variantsError) {
          console.error("Error fetching variants:", variantsError.message);
          toast.error(`ভ্যারিয়েন্ট লোড করতে সমস্যা: ${variantsError.message}`);
        }
        
        if (vars && vars.length > 0) {
          // Use new variants system - mark as NOT from diamond_packages
          const variantsWithFlag = vars.map((v: any) => ({
            ...v,
            isFromDiamondPackages: false, // Explicitly mark as product_variants
            reward_coins: v.reward_coins || 0, // Ensure reward_coins is set
          }));
          setVariants(variantsWithFlag as any);
        } else {
          // Fallback to diamond_packages (old system) with reward_coins
          const { data: pkgs } = await supabase
            .from("diamond_packages")
            .select("id, diamonds, price, name, reward_coins")
            .eq("product_id", prod.id)
            .eq("is_active", true)
            .order("sort_order");
          
          if (pkgs) {
            // Convert diamond_packages to variant format - Include admin-set name
            const convertedVariants = pkgs.map((pkg: any) => ({
              id: pkg.id,
              name: pkg.name || "", // Use admin-set name or empty
              value: `${pkg.diamonds}`, // Just the number
              price: pkg.price,
              reward_coins: (pkg as any).reward_coins || 0,
              isFromDiamondPackages: true, // Flag to track source
            }));
            setVariants(convertedVariants as any);
          }
        }

        const { data: related } = await supabase
          .from("products")
          .select("id, name, slug, image, image_url, category, description")
          .eq("is_active", true)
          .neq("slug", slug)
          .limit(6);
        if (related) setRelatedProducts(related as Product[]);
      }
      setLoading(false);
    };
    fetchData();
    
    // Simulate real-time view count
    const randomViewers = Math.floor(Math.random() * 20) + 5; // 5-25 viewers
    setViewCount(randomViewers);
  }, [slug]);

  const getImage = (p: Product) => {
    if (p.image_url) return p.image_url;
    if (p.image && localImageMap[p.image]) return localImageMap[p.image];
    return "/placeholder.svg";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-foreground">Product not found</div>;

  const selectedPrice = selectedVariant !== null ? variants.find(v => v.id === selectedVariant)?.price || 0 : 0;

  const handleOrder = async () => {
    if (!user) return;
    if (!product) return;

    if (!selectedVariant) { 
      console.error("No variant selected");
      toast.error("একটি ভ্যারিয়েন্ট সিলেক্ট করুন"); 
      return; 
    }
    if (!product.is_voucher && !playerId.trim()) { 
      console.error("Player ID required but not provided");
      toast.error("Player UID দিন"); 
      return; 
    }

    const variant = variants.find(v => v.id === selectedVariant) || null;
    
    // Validate variant exists and has valid ID
    if (!variant || !variant.id) {
      console.error("Invalid variant selected:", { selectedVariant, variant });
      toast.error("ভ্যারিয়েন্ট বৈধ নয়। আবার সিলেক্ট করুন।");
      return;
    }
    
    console.log("=== CHECKOUT DEBUG INFO ===");
    console.log("Selected Variant ID:", selectedVariant);
    console.log("Found variant object:", variant);
    console.log("Is from diamond_packages?:", variant?.isFromDiamondPackages);
    console.log("All available variants:", variants.map(v => ({ id: v.id, isFromDiamondPackages: v.isFromDiamondPackages })));
    console.log("Variant ID type:", typeof variant?.id);
    console.log("===========================");
    
    const packageInfo = product.is_voucher ? (variant ? `Voucher - ৳${variant.price}` : "Voucher Code") : `${variant.value}`;
    const amount = variant ? variant.price : 0;
    
    console.log("Checkout attempt:", {
      productId: product.id,
      productName: product.name,
      variantId: variant?.id,
      variantValue: variant?.value,
      price: amount,
      paymentMethod,
      playerId: product.is_voucher ? 'N/A' : playerId,
      isVoucher: product.is_voucher
    });

    if (paymentMethod === "coin") {
      // Pay with coins
      if (!profile || profile.coins < amount) {
        toast.error("পর্যাপ্ত কয়েন নেই! Wallet এ টাকা যোগ করুন।");
        return;
      }

      setOrdering(true);
      
      try {
        // Prepare order data
        const orderData: any = {
          user_id: user.id,
          product_name: product.name,
          player_id: product.is_voucher ? null : playerId,
          package_info: packageInfo,
          amount: 0, // Free because paid with coins
          status: "completed", // Auto-complete wallet/coin payments
          payment_method: "coin",
        };

        console.log("Creating coin order with data:", orderData);
        console.log("Variant ID to insert:", variant?.id);
        console.log("Is from diamond_packages?:", variant?.isFromDiamondPackages);

        // Only add variant_id if variant exists and has an ID AND is from product_variants
        if (variant?.id && !variant.isFromDiamondPackages) {
          orderData.variant_id = variant.id;
          console.log("Added variant_id to order:", variant.id);
          console.log("Variant ID in orderData:", orderData.variant_id);
        }
        
        // Add package_id if variant is from diamond_packages
        if (variant?.id && variant.isFromDiamondPackages) {
          orderData.package_id = variant.id;
          console.log("Added package_id to order:", variant.id);
        }

        console.log("Final order data before insert:", JSON.stringify(orderData, null, 2));

        // Validate variant exists in database before inserting order
        if (variant?.id && !variant.isFromDiamondPackages) {
          const { data: variantCheck } = await supabase
            .from("product_variants")
            .select("id")
            .eq("id", variant.id)
            .single();
          
          if (!variantCheck) {
            console.error("Variant not found in database! ID:", variant.id);
            toast.error("এই ভ্যারিয়েন্ট আর উপলব্ধ নয়। দয়া করে আবার চেষ্টা করুন।");
            setOrdering(false);
            window.location.reload();
            return;
          }
        }

        const { data: createdOrder, error: orderError } = await supabase.from("orders").insert(orderData).select("id").single();

        if (orderError) {
          console.error("Order creation error details:", {
            error: orderError,
            orderData,
            variantId: variant?.id,
            variantType: variant?.isFromDiamondPackages ? 'diamond_packages' : 'product_variants',
            errorCode: orderError.code,
            errorMessage: orderError.message
          });
          
          if (orderError.code === '23503') {
            toast.error("ভ্যারিয়েন্ট পাওয়া যায়নি। দয়া করে পেজ রিফ্রেশ করুন।");
          } else {
            toast.error(`অর্ডার তৈরি ব্যর্থ: ${orderError.message}`);
          }
          setOrdering(false);
          return;
        }

        if (!createdOrder) {
          toast.error("অর্ডার ডাটা পাওয়া যায়নি");
          setOrdering(false);
          return;
        }

        // Spend coins
        const { error: spendError } = await supabase.rpc("spend_coins", {
          _user_id: user.id,
          _amount: amount,
          _transaction_type: "checkout_used",
          _reference_id: createdOrder.id,
          _description: `Purchased ${product.name} - ${packageInfo}`,
        });

        if (spendError) {
          console.error("Spend coins error:", spendError);
          toast.error(`কয়েন কাটতে সমস্যা: ${spendError.message}`);
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", createdOrder.id);
          setOrdering(false);
          return;
        }

        // Assign voucher code if product is voucher
        let voucherCodeAssigned = false;
        if (product.is_voucher) {
          const { data: voucherCode } = await supabase.rpc("assign_voucher_to_order", {
            _order_id: createdOrder.id,
            _product_id: product.id,
            _user_id: user.id,
            _package_id: variant?.id || null,
          });

          if (voucherCode) {
            voucherCodeAssigned = true;
            if (variant?.reward_coins && variant.reward_coins > 0) {
              toast.success(`ভাউচার কোড পেয়েছেন! My Codes এ দেখুন। +${variant.reward_coins} 🪙 বোনাস পেয়েছেন`);
            } else {
              toast.success("ভাউচার কোড পেয়েছেন! My Codes এ দেখুন।");
            }
          } else {
            toast.error("দুঃখিত, স্টকে কোড নেই।");
            await supabase.from("orders").update({ status: "cancelled" }).eq("id", createdOrder.id);
            // Refund coins
            await supabase.rpc("refund_coins", {
              _user_id: user.id,
              _amount: amount,
              _transaction_type: "order_cancelled",
              _reference_id: createdOrder.id,
              _description: "Refund due to out of stock voucher code"
            });
            setOrdering(false);
            refreshProfile();
            return;
          }
        } else {
          // Non-voucher product
          if (variant?.reward_coins && variant.reward_coins > 0) {
            toast.success(`অর্ডার সফল হয়েছে! +${variant.reward_coins} 🪙 বোনাস পেয়েছেন`);
          } else {
            toast.success("অর্ডার সফল হয়েছে!");
          }
        }

        refreshProfile();
        setSelectedVariant(null);
        setPlayerId("");
        setOrdering(false);
      } catch (err: any) {
        console.error("Coin payment error:", err);
        toast.error(`পেমেন্ট ব্যর্থ: ${err.message || "অজানা ত্রুটি"}`);
        setOrdering(false);
      }
      return;
    }

    if (paymentMethod === "wallet") {
      // Pay with wallet balance
      if (!profile || profile.balance < amount) {
        toast.error("ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। Add Money করুন।");
        return;
      }

      setOrdering(true);
      
      try {
        // Prepare order data
        const orderData: any = {
          user_id: user.id,
          product_name: product.name,
          player_id: product.is_voucher ? null : playerId,
          package_info: packageInfo,
          amount,
          status: "completed", // Auto-complete wallet/coin payments
          payment_method: "wallet",
        };

        console.log("Creating wallet order with data:", orderData);
        console.log("Variant info:", { id: variant?.id, fromDiamondPackages: variant?.isFromDiamondPackages });

        // Add variant_id or package_id based on source
        if (variant?.id && !variant.isFromDiamondPackages) {
          orderData.variant_id = variant.id;
          console.log("Added variant_id to order:", variant.id);
          console.log("Variant ID in orderData:", orderData.variant_id);
        }
        
        if (variant?.id && variant.isFromDiamondPackages) {
          orderData.package_id = variant.id;
          console.log("Added package_id to order:", variant.id);
        }

        console.log("Final order data before insert:", JSON.stringify(orderData, null, 2));

        // Validate variant exists in database before inserting order
        if (variant?.id && !variant.isFromDiamondPackages) {
          const { data: variantCheck } = await supabase
            .from("product_variants")
            .select("id")
            .eq("id", variant.id)
            .single();
          
          if (!variantCheck) {
            console.error("Variant not found in database! ID:", variant.id);
            toast.error("এই ভ্যারিয়েন্ট আর উপলব্ধ নয়। দয়া করে আবার চেষ্টা করুন।");
            setOrdering(false);
            // Refresh variants
            window.location.reload();
            return;
          }
        }

        const { data: orderDataResult, error: orderError } = await supabase.from("orders").insert(orderData).select("id").single();

        if (orderError || !orderDataResult) { 
          console.error("Wallet order error:", {
            error: orderError,
            orderData,
            variantId: variant?.id,
            variantType: variant?.isFromDiamondPackages ? 'diamond_packages' : 'product_variants',
            errorMessage: orderError?.message,
            errorCode: orderError?.code
          }); 
          
          // Provide user-friendly error message based on error type
          if (orderError?.code === '23503') {
            toast.error("ভ্যারিয়েন্ট পাওয়া যায়নি। দয়া করে পেজ রিফ্রেশ করুন।");
          } else {
            toast.error(`অর্ডার করতে সমস্যা হয়েছে: ${orderError?.message || "Unknown error"}`);
          }
          setOrdering(false); 
          return; 
        }

        // Deduct wallet balance
        const newBalance = profile.balance - amount;
        const { error: updateError } = await supabase.from("profiles").update({ balance: newBalance }).eq("user_id", user.id);
        
        if (updateError) {
          console.error("Balance update error:", updateError);
          toast.error("ব্যালেন্স আপডেট করতে সমস্যা হয়েছে");
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderDataResult.id);
          setOrdering(false);
          return;
        }

        if (product.is_voucher) {
          const { data: voucherCode } = await supabase.rpc("assign_voucher_to_order", {
            _order_id: orderDataResult.id,
            _product_id: product.id,
            _user_id: user.id,
            _package_id: variant?.id || null,
          });

          if (voucherCode) {
            toast.success("ভাউচার কোড পেয়েছেন! My Codes এ দেখুন।");
          } else {
            toast.error("দুঃখিত, স্টকে কোড নেই।");
            await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderDataResult.id);
            // Refund balance
            await supabase.from("profiles").update({ balance: profile.balance }).eq("user_id", user.id);
            setOrdering(false);
            refreshProfile();
            return;
          }
        } else {
          toast.success("অর্ডার সফল হয়েছে!");
        }

        refreshProfile();
        setSelectedVariant(null);
        setPlayerId("");
        setOrdering(false);
      } catch (err: any) {
        console.error("Wallet payment error:", err);
        toast.error(`পেমেন্ট ব্যর্থ: ${err.message || "অজানা ত্রুটি"}`);
        setOrdering(false);
      }
    } else {
      // Instant Pay via UddoktaPay
      setOrdering(true);
      try {
        const redirectUrl = `${window.location.origin}/payment-callback`;

        console.log("Creating payment with data:", {
          type: "product",
          product_name: product.name,
          player_id: product.is_voucher ? null : playerId,
          package_info: packageInfo,
          amount,
          product_id: product.id,
          package_id: variant?.id || null,
          variant_id: variant?.id && !variant.isFromDiamondPackages ? variant.id : null,
          is_voucher: product.is_voucher,
          full_name: profile?.display_name || "Customer",
          redirect_url: redirectUrl,
        });

        const requestBody = {
          type: "product",
          product_name: product.name,
          player_id: product.is_voucher ? null : playerId,
          package_info: packageInfo,
          amount,
          product_id: product.id,
          // Send ONLY the correct ID based on variant source
          // New system (product_variants): send variant_id only
          // Old system (diamond_packages): send package_id only
          package_id: variant?.isFromDiamondPackages ? variant.id : null,
          variant_id: variant && !variant.isFromDiamondPackages ? variant.id : null,
          is_voucher: product.is_voucher,
          full_name: profile?.display_name || "Customer",
          redirect_url: redirectUrl,
        };

        console.log("=== UDDOKTAPAY PAYMENT DEBUG ===");
        console.log("Variant source:", variant?.isFromDiamondPackages ? "diamond_packages (OLD)" : "product_variants (NEW)");
        console.log("Request body:", requestBody);
        console.log("Sending IDs:", {
          package_id: requestBody.package_id,
          variant_id: requestBody.variant_id,
          logic: variant?.isFromDiamondPackages 
            ? "Using package_id (old system)" 
            : "Using variant_id (new system)"
        });
        console.log("Invoking create-payment function...");

        let functionResponse;
        try {
          functionResponse = await supabase.functions.invoke("create-payment", {
            body: requestBody,
          });
        } catch (invokeError: any) {
          console.error("Edge function invocation error:", {
            name: invokeError.name,
            message: invokeError.message,
            stack: invokeError.stack,
          });
          
          // Handle non-2xx status codes
          if (invokeError.message?.includes("non-2xx")) {
            toast.error("পেমেন্ট সার্ভার সমস্যা। কিছুক্ষণ পর চেষ্টা করুন।");
            setOrdering(false);
            return;
          }
          throw invokeError;
        }

        const { data, error } = functionResponse;

        console.log("Response received:", { data, error });
        console.log("===============================");

        if (error || !data?.payment_url) {
          console.error("Payment creation failed:", {
            error,
            data,
            variantId: variant?.id,
            variantType: variant?.isFromDiamondPackages ? 'diamond_packages' : 'product_variants',
            errorMessage: error?.message,
            errorDetails: JSON.stringify(error)
          });
          
          // Show more specific error message
          let errorMsg = "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।";
          if (data?.error) {
            errorMsg = data.error;
          } else if (error?.message?.includes("API key")) {
            errorMsg = "পেমেন্ট গেটওয়ে কনফিগারেশন সমস্যা। এডমিনকে যোগাযোগ করুন।";
          } else if (error?.message) {
            errorMsg = error.message;
          }
          
          toast.error(errorMsg);
          setOrdering(false);
          return;
        }

        // Redirect to UddoktaPay
        window.location.href = data.payment_url;
      } catch (err) {
        console.error("Payment creation error:", err);
        toast.error(err instanceof Error ? err.message : "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।");
        setOrdering(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Banner */}
        <div className="rounded-xl overflow-hidden card-shadow relative">
          <img src={getImage(product)} alt={product.name} className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-primary-foreground font-bold text-lg">{product.name}</h1>
              <p className="text-primary-foreground/70 text-sm">{product.category}</p>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-border flex items-center gap-2 animate-pulse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-foreground">{viewCount} {viewCount === 1 ? 'user' : 'users'} viewing now</span>
          </div>
        </div>

        {/* Step 1: Select Recharge */}
        {variants.length > 0 && (
          <section className="bg-card rounded-xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
                <h2 className="font-bold">ভ্যারিয়েন্ট সিলেক্ট করুন</h2>
              </div>
              <span className="text-sm text-muted-foreground">কিনে পান <span className="text-secondary font-bold">{variants.find(v => v.id === selectedVariant)?.reward_coins || 0}</span> Coins 🪙</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`relative flex flex-col items-start justify-between px-3 py-3 rounded-lg border transition bg-card ${
                    selectedVariant === variant.id
                      ? "border-primary shadow-sm bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="w-full mb-2">
                    <div className="text-xs font-semibold text-foreground mb-0.5 truncate">
                      {variant.value}
                    </div>
                    {variant.name && variant.name.trim() !== "" && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {variant.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-primary font-bold text-xs">৳{variant.price}</span>
                    {variant.reward_coins > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        +{variant.reward_coins} 🪙
                      </Badge>
                    )}
                  </div>
                  {coinValue > 0 && (
                    <div className="text-[9px] text-muted-foreground text-center w-full bg-accent/50 rounded py-0.5 mt-1">
                      {(variant.price / coinValue).toFixed(0)} 🪙 = ৳{variant.price}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: Account Info */}
        {!product.is_voucher && (
          <section className="bg-card rounded-xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
                <h2 className="font-bold">Account Info</h2>
              </div>
            </div>
            <label className="text-sm font-medium mb-1 block">Player UID</label>
            <Input placeholder="Player UID" value={playerId} onChange={e => setPlayerId(e.target.value)} />
          </section>
        )}

        {/* Step 3: Payment */}
        <section className="bg-card rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">{product.is_voucher ? "2" : "3"}</span>
            <h2 className="font-bold">Payment Methods</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod("wallet")}
              className={`rounded-xl p-4 border-2 transition text-center ${
                paymentMethod === "wallet" ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <span className="text-3xl">💰</span>
              <p className="text-sm font-semibold mt-2">Wallet</p>
              {profile && <p className="text-xs text-muted-foreground mt-1">৳{profile.balance}</p>}
            </button>
            <button
              onClick={() => setPaymentMethod("coin")}
              disabled={profile?.coins === 0}
              className={`rounded-xl p-4 border-2 transition text-center ${
                paymentMethod === "coin" ? "border-primary bg-accent" : "border-border"
              } ${profile?.coins === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-3xl">🪙</span>
              <p className="text-sm font-semibold mt-2">Coins</p>
              <p className="text-xs text-muted-foreground mt-1">{profile?.coins || 0} 🪙</p>
            </button>
            <button
              onClick={() => setPaymentMethod("instant")}
              className={`rounded-xl p-4 border-2 transition text-center ${
                paymentMethod === "instant" ? "border-primary bg-accent" : "border-border"
              }`}
            >
              <span className="text-3xl">⚡</span>
              <p className="text-sm font-semibold mt-2">Instant Pay</p>
              <p className="text-xs text-muted-foreground mt-1">UddoktaPay</p>
            </button>
          </div>
          
          {paymentMethod === "coin" && selectedVariant && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Coin Payment Selected
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                  -{selectedPrice} 🪙
                </Badge>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2 ml-7">
                আপনার কাছে {profile?.coins || 0} কয়েন আছে। এই পণ্য কিনতে {selectedPrice} কয়েন লাগবে।
                {(profile?.coins || 0) >= selectedPrice ? (
                  <span className="font-bold text-green-800 dark:text-green-200"> ✓ পর্যাপ্ত কয়েন</span>
                ) : (
                  <span className="font-bold text-red-600 dark:text-red-400"> ✗ অপর্যাপ্ত কয়েন</span>
                )}
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
            ℹ️ প্রোডাক্ট কিনতে আপনার প্রয়োজন <span className="text-secondary font-bold">৳ {selectedPrice}</span> টাকা।
          </p>
          {user ? (
            <Button
              onClick={handleOrder}
              disabled={ordering}
              className="w-full mt-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              {ordering ? "প্রসেসিং..." : "অর্ডার করুন"}
            </Button>
          ) : (
            <>
              <p className="text-sm text-primary mt-2 flex items-center gap-1">
                ℹ️ Please Login To Purchase
              </p>
              <Link to="/login">
                <Button className="w-full mt-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                  LOGIN
                </Button>
              </Link>
            </>
          )}
        </section>

        {/* Product Info */}
        <section className="bg-card rounded-xl p-4 card-shadow">
          <h2 className="font-bold text-lg mb-3 border-b border-border pb-2">Product Information</h2>
          {product.description ? (
            <div className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</div>
          ) : (
            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
              <li>শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে।</li>
              <li>Player ID Code ভুল দিয়ে Diamond না পেলে Games Bazar কর্তৃপক্ষ দায়ী নয়।</li>
              <li>Order কমপ্লিট হওয়ার পরেও আইডিতে ডায়মন্ড না গেলে সাপোর্টে মেসেজ দিন।</li>
              <li>অর্ডার Cancel হলে কি কারণে তা Cancel হয়েছে তা অর্ডার হিস্টোরিতে দেওয়া থাকে।</li>
            </ul>
          )}
        </section>

        {/* Related Items */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="font-bold text-lg text-center mb-4">Related Items</h2>
            <div className="grid grid-cols-3 gap-3">
              {relatedProducts.map(p => (
                <Link key={p.id} to={`/product/${p.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow">
                    <img src={getImage(p)} alt={p.name} className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-center mt-2">{p.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default ProductDetail;
