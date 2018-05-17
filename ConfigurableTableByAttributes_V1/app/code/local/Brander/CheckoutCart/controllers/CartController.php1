<?php


require_once Mage::getModuleDir('controllers', 'Mage_Checkout') . DS . 'CartController.php';

/**
 * Class CartController
 */
class Brander_CheckoutCart_CartController extends Mage_Checkout_CartController
{

    public function indexAction()
    {
        $this->loadLayout();
        $this->renderLayout();
    }

    public function addAction()
    {
        if (!$this->_validateFormKey()) {
            $this->_goBack();
            return;
        }
        $cart   = $this->_getCart();
        $params = $this->getRequest()->getParams();

        $productIds = [];
        foreach ($params as $key => $value) {
            if(stristr($key,'product-')) {
                $productIds[$value] = $this->_getProductQty($params, str_replace('product-', '', $key));
            }
        }

        if(!count($productIds)) {
            return parent::addAction();
        }

        try {
            foreach ($productIds as $productId => $qty) {
                if($qty < 1) {
                    continue;
                }

                if (isset($qty)) {
                    $filter = new Zend_Filter_LocalizedToNormalized(
                        array('locale' => Mage::app()->getLocale()->getLocaleCode())
                    );
                    $qty = $filter->filter($qty);
                    $params['qty'] = $qty;
                }

                $product = Mage::getModel('catalog/product')
                    ->setStoreId(Mage::app()->getStore()->getId())
                    ->load($productId);

                $related = $this->getRequest()->getParam('related_product');

                /**
                 * Check product availability
                 */
                if (!$product) {
                    $this->_goBack();
                    return;
                }

                $cart->addProduct($product, $params);
                if (!empty($related)) {
                    $cart->addProductsByIds(explode(',', $related));
                }

            }

            $cart->save();

            $this->_getSession()->setCartWasUpdated(true);

            /**
             * @todo remove wishlist observer processAddToCart
             */
            Mage::dispatchEvent('checkout_cart_add_product_complete',
                array('product' => $product, 'request' => $this->getRequest(), 'response' => $this->getResponse())
            );

            if (!$this->_getSession()->getNoCartRedirect(true)) {
                if (!$cart->getQuote()->getHasError()) {
                    $message = $this->__('%s was added to your shopping cart.', Mage::helper('core')->escapeHtml($product->getName()));
                    $this->_getSession()->addSuccess($message);
                }
                $this->_goBack();
            }
        } catch (Mage_Core_Exception $e) {
            if ($this->_getSession()->getUseNotice(true)) {
                $this->_getSession()->addNotice(Mage::helper('core')->escapeHtml($e->getMessage()));
            } else {
                $messages = array_unique(explode("\n", $e->getMessage()));
                foreach ($messages as $message) {
                    $this->_getSession()->addError(Mage::helper('core')->escapeHtml($message));
                }
            }

            $url = $this->_getSession()->getRedirectUrl(true);
            if ($url) {
                $this->getResponse()->setRedirect($url);
            } else {
                $this->_redirectReferer(Mage::helper('checkout/cart')->getCartUrl());
            }
        } catch (Exception $e) {
            $this->_getSession()->addException($e, $this->__('Cannot add the item to shopping cart.'));
            Mage::logException($e);
            $this->_goBack();
        }
    }

    /**
     * @param $params
     * @param $keyProduct
     * @return mixed
     */
    protected function _getProductQty($params, $keyProduct)
    {
        foreach ($params as $key => $value) {
            if($keyProduct === $key) {
                return $value;
            }
        }
    }
}