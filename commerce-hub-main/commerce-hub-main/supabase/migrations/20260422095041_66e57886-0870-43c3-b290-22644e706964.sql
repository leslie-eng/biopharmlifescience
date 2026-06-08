
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten public insert policies (require non-empty key fields)
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT WITH CHECK (
    customer_name IS NOT NULL AND length(customer_name) > 0
    AND total >= 0
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IS NOT NULL
    AND quantity > 0
    AND unit_price >= 0
  );

DROP POLICY IF EXISTS "Anyone can subscribe to restock" ON public.stock_interest;
CREATE POLICY "Anyone can subscribe to restock" ON public.stock_interest
  FOR INSERT WITH CHECK (
    product_id IS NOT NULL
    AND email IS NOT NULL
    AND length(email) > 3
    AND notified = false
  );
