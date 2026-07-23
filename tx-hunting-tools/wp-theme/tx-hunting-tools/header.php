<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<nav class="site-nav" id="site-nav">
	<div class="wrap">
		<a class="logo-mark" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<span class="mark">THT</span>
			<span><?php bloginfo( 'name' ); ?></span>
		</a>

		<button class="nav-toggle" aria-expanded="false" aria-controls="primary-menu">MENU</button>

		<?php
		if ( has_nav_menu( 'primary' ) ) {
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'nav-links',
					'menu_id'        => 'primary-menu',
				)
			);
		} else {
			// Fallback anchors matching the one-page layout until a menu is assigned.
			?>
			<ul class="nav-links" id="primary-menu">
				<li><a href="<?php echo esc_url( home_url( '/#shop' ) ); ?>">Shop</a></li>
				<li><a href="<?php echo esc_url( home_url( '/#capabilities' ) ); ?>">Capabilities</a></li>
				<li><a href="<?php echo esc_url( home_url( '/#custom-work' ) ); ?>">Custom Work</a></li>
				<li><a href="<?php echo esc_url( home_url( '/#contact' ) ); ?>">Contact</a></li>
			</ul>
			<?php
		}
		?>

		<a class="btn nav-cta" href="<?php echo esc_url( txht_opt( 'txht_nav_cta_url' ) ); ?>"><?php echo esc_html( txht_opt( 'txht_nav_cta_label' ) ); ?></a>
	</div>
</nav>
