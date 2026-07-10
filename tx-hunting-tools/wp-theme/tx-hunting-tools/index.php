<?php
/**
 * Generic fallback template (also covers blog/archive views if ever enabled).
 */

get_header();
?>

<div class="page-body">
	<div class="wrap">
		<?php if ( have_posts() ) : ?>
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class(); ?>>
					<h1><?php the_title(); ?></h1>
					<div class="entry-content"><?php the_content(); ?></div>
				</article>
			<?php endwhile; ?>
		<?php else : ?>
			<h1><?php esc_html_e( 'Nothing here', 'txht' ); ?></h1>
			<p class="section-lede"><?php esc_html_e( 'The page you were after does not exist.', 'txht' ); ?></p>
			<a class="btn" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the shop', 'txht' ); ?></a>
		<?php endif; ?>
	</div>
</div>

<?php
get_footer();
